from difflib import SequenceMatcher
import re

class ReadingEvaluator:
    def __init__(self, similarity_threshold: float = 0.6):
        self.similarity_threshold = similarity_threshold

    def _normalize(self, text: str):
        return re.sub(r'[^\w\s]', '', text.lower()).strip()

    def _get_similarity(self, a: str, b: str):
        return SequenceMatcher(None, self._normalize(a), self._normalize(b)).ratio()

    def evaluate(self, expected_text: str, whisper_words: list):
        expected_tokens = expected_text.split()
        word_map = []
        
        accurate_count = 0
        total_expected = len(expected_tokens)
        
        wrong_words = []
        skipped_words = []
        extra_words = []
        repeated_words = []
        
        w_idx = 0
        w_len = len(whisper_words)
        claimed_indices = set()
        
        for e_token in expected_tokens:
            e_norm = self._normalize(e_token)
            found_match = False
            
            for look_ahead in range(3):
                if (w_idx + look_ahead) >= w_len:
                    break
                    
                w_token = whisper_words[w_idx + look_ahead]
                w_norm = self._normalize(w_token["word"])
                similarity = self._get_similarity(e_norm, w_norm)
                
                if similarity >= 1.0:
                    status = "correct"
                    accurate_count += 1
                    found_match = True
                elif similarity >= self.similarity_threshold:
                    status = "mispronounced"
                    wrong_words.append(e_token)
                    found_match = True
                else:
                    continue
                
                if found_match:
                    claimed_idx = w_idx + look_ahead
                    claimed_indices.add(claimed_idx)
                    word_map.append({
                        "word": e_token,
                        "start": w_token["start"],
                        "end": w_token["end"],
                        "status": status,
                        "similarity": round(similarity, 2)
                    })
                    w_idx = claimed_idx + 1
                    break
            
            if not found_match:
                word_map.append({
                    "word": e_token,
                    "start": None,
                    "end": None,
                    "status": "skipped",
                    "similarity": 0
                })
                skipped_words.append(e_token)
                
        last_claimed_word = ""
        for i, w_token in enumerate(whisper_words):
            if i not in claimed_indices:
                w_word = self._normalize(w_token["word"])
                if self._get_similarity(w_word, last_claimed_word) >= 0.8:
                    repeated_words.append(w_token["word"])
                else:
                    extra_words.append(w_token["word"])
            else:
                last_claimed_word = self._normalize(w_token["word"])

        first_match = next((m for m in word_map if m["start"] is not None), None)
        last_match = next((m for m in reversed(word_map) if m["end"] is not None), None)
        duration_seconds = 0
        if first_match and last_match:
            duration_seconds = last_match["end"] - first_match["start"]
            
        wcpm = round((total_expected / duration_seconds) * 60) if duration_seconds > 0 else 0

        import re as regex
        sentences = regex.split(r'(?<=[.?!,;:])\s+', expected_text.strip())
        total_chunks = len(sentences)
        correct_chunks = 0
        
        map_idx = 0
        for sentence in sentences:
            sentence_tokens = sentence.split()
            chunk_mistake = False
            chunk_words = word_map[map_idx:map_idx + len(sentence_tokens)]
            map_idx += len(sentence_tokens)
            
            for index, cw in enumerate(chunk_words):
                if cw["status"] == "skipped" or cw["status"] == "mispronounced":
                    chunk_mistake = True
                    break
                if index > 0 and cw["start"] is not None and chunk_words[index-1]["end"] is not None:
                    if cw["start"] - chunk_words[index-1]["end"] > 1.5:
                        chunk_mistake = True
                        break
            
            if not chunk_mistake:
                correct_chunks += 1
                
        chunking_score = round((correct_chunks / total_chunks) * 100, 1) if total_chunks > 0 else 0
        accuracy_score = round((accurate_count / total_expected) * 100, 1) if total_expected > 0 else 0

        return {
            "accuracy_score": accuracy_score,
            "wcpm": wcpm,
            "chunking_score": chunking_score,
            "total_words": total_expected,
            "correct_words": accurate_count,
            "wrong_words": wrong_words,
            "skipped_words": skipped_words,
            "extra_words": extra_words,
            "repeated_words": repeated_words,
            "word_map": word_map
        }
