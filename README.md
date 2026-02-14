# Radah Matching Engine

A PHP-based professional matching engine that matches projects with teams of professionals based on capabilities, experience, industry fit, and semantic similarity.

## Features

- **NLP Signal Extraction**: Extracts capabilities, roles, and industries from project descriptions
- **TF-IDF Similarity**: Calculates semantic similarity between project descriptions and professional summaries
- **Multi-factor Scoring**: Combines capability overlap, industry experience, TF-IDF similarity, experience level, and availability
- **Team Generation**: Generates optimal teams of professionals for projects

## Requirements

- PHP >= 8.0
- Composer (for dependency management)
- Firebase Admin SDK (for Firebase integration)

## Installation

1. **Clone the repository** (if applicable):
   ```bash
   git clone <repository-url>
   cd radah_matching
   ```

2. **Install dependencies**:
   ```bash
   composer install
   ```

3. **Set up environment variables**:
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and configure your Firebase credentials and other settings.

4. **Configure Firebase credentials**:
   - Place your `firebase_credentials.json` file in the project root
   - Update `FIREBASE_CREDENTIALS_PATH` in `.env` if needed

## Usage

### Basic Usage

Run the test script:
```bash
php test_matching.php
```

### Using the Matching Engine

```php
<?php
require_once __DIR__ . "/matching_engine.php";

$project = [
    "description" => "Your project description here...",
    "industry" => "software",
    "budget_range" => "5000_10000"
];

$professionals = [
    // Array of professional profiles
];

$result = MatchingEngine::generateTeam($project, $professionals, 4);
```

## Project Structure

```
radah_matching/
├── matching_engine.php      # Main matching engine class
├── nlp_extractor.php        # NLP signal extraction
├── tfidf.php                # TF-IDF similarity calculation
├── enums.php                # Enumerations and constants
├── test_matching.php        # Test script
├── composer.json            # Composer dependencies
├── .env.example            # Environment variables template
└── README.md               # This file
```

## Environment Variables

See `.env.example` for all available environment variables. Key variables:

- `FIREBASE_CREDENTIALS_PATH`: Path to Firebase credentials JSON file
- `FIREBASE_PROJECT_ID`: Firebase project ID
- `DEFAULT_TEAM_SIZE`: Default team size (default: 4)
- Scoring weights for customizing the matching algorithm

## Development

### Running Tests

```bash
composer test
```

### Code Style

Follow PSR-12 coding standards.

## License

[Add your license here]

## Contributing

[Add contribution guidelines here]









