# @elizaos-plugins/plugin-elfa-ai

A plugin for social media analytics and insights using Elfa AI API.

## Overview

This plugin provides functionality to:

- `Ping (/v1/ping)`: Health check for API availability.
- `API Key Status (/v1/key-status)`: Checks the API key status and usage.
- `Smart Mentions (/v1/mentions)`: Retrieves social media mentions with smart engagement filtering.
- `Top Mentions (/v1/top-mentions)`: Fetches the most relevant mentions of a specific ticker symbol.
- `Search Mentions (/v1/mentions/search)`: Queries tweets based on keywords.
- `Trending Tokens (/v1/trending-tokens)`: Identifies the most discussed tokens in a specific time frame.
- `Twitter Account Stats (/v1/account/smart-stats)`: Provides smart engagement statistics for Twitter accounts.

## Installation

```bash
pnpm install @elizaos-plugins/plugin-elfa-ai
```

## Configuration

Prerequisite - Get Elfa AI API credentials from: <https://dev.elfa.ai/dashboard?tab=usage>

The plugin requires the following environment variables:

```env
ELFA_AI_BASE_URL=https://api.elfa.ai    # Required: Base URL for the API
ELFA_AI_API_KEY=your_api_key    # Required: API key for authentication
```

## License

This plugin is part of the Eliza project. See the main project repository for license information.

## Resources

- [Elfa AI API Documentation](https://api-docs.elfa.ai/#/)
- [Developer Portal](https://dev.elfa.ai/dashboard?tab=usage)
