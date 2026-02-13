<?php
// TF-IDF for text similarity

require_once __DIR__ . '/../bootstrap.php';

class TFIDF
{
    public static function tokenize(string $text): array
    {
        $text = strtolower($text);
        $text = preg_replace("/[^a-z0-9\s]/", " ", $text);
        $text = preg_replace("/\s+/", " ", $text);
        $text = trim($text);

        if ($text === "") return [];

        $stopwords = [
            "the","and","for","with","that","this","from","they","them","then","than",
            "have","has","had","will","would","can","could","should","a","an","to","of",
            "in","on","at","by","as","is","are","was","were","be","been","being",
            "we","our","you","your","i","me","my","it","its","their","there","here",
            "or","but","if","so","not","no","yes","into","about","over","under",
            "project","success","requirements","need","needed"
        ];

        $tokens = explode(" ", $text);

        $clean = [];
        foreach ($tokens as $t) {
            if ($t === "") continue;
            if (strlen($t) < 2) continue;
            if (in_array($t, $stopwords, true)) continue;
            $clean[] = $t;
        }

        return $clean;
    }

    public static function buildIDF(array $docsTokens): array
    {
        $docCount = count($docsTokens);
        $df = [];

        foreach ($docsTokens as $tokens) {
            $unique = array_unique($tokens);
            foreach ($unique as $term) {
                $df[$term] = ($df[$term] ?? 0) + 1;
            }
        }

        $idf = [];
        foreach ($df as $term => $count) {
            $idf[$term] = log(($docCount + 1) / ($count + 1)) + 1;
        }

        return $idf;
    }

    public static function vectorize(array $tokens, array $idf): array
    {
        $tf = [];
        foreach ($tokens as $t) {
            $tf[$t] = ($tf[$t] ?? 0) + 1;
        }

        $vec = [];
        foreach ($tf as $term => $freq) {
            $vec[$term] = $freq * ($idf[$term] ?? 0.0);
        }

        return $vec;
    }

    public static function cosineSimilarity(array $vecA, array $vecB): float
    {
        $dot = 0.0;
        $normA = 0.0;
        $normB = 0.0;

        foreach ($vecA as $term => $val) {
            $dot += $val * ($vecB[$term] ?? 0.0);
            $normA += $val * $val;
        }

        foreach ($vecB as $val) {
            $normB += $val * $val;
        }

        if ($normA == 0.0 || $normB == 0.0) return 0.0;

        return $dot / (sqrt($normA) * sqrt($normB));
    }
}
