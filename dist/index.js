// src/actions/ping.ts
import {
  elizaLogger
} from "@elizaos/core";

// src/environment.ts
import { z } from "zod";
var elfaAiEnvSchema = z.object({
  ELFA_AI_BASE_URL: z.string().min(1, "Base URL is required for interacting with Elfa AI"),
  ELFA_AI_API_KEY: z.string().min(1, "API key is required for interacting with Elfa AI")
});
async function validateElfaAiConfig(runtime) {
  try {
    const config = {
      ELFA_AI_BASE_URL: runtime.getSetting("ELFA_AI_BASE_URL") || process.env.ELFA_AI_BASE_URL,
      ELFA_AI_API_KEY: runtime.getSetting("ELFA_AI_API_KEY") || process.env.ELFA_AI_API_KEY
    };
    return elfaAiEnvSchema.parse(config);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessages = error.errors.map((err) => `${err.path.join(".")}: ${err.message}`).join("\n");
      throw new Error(
        `Elfa AI configuration validation failed:
${errorMessages}`
      );
    }
    throw error;
  }
}

// src/actions/ping.ts
import axios from "axios";
var elfaPingAction = {
  name: "ELFA_PING",
  similes: ["ping elfa", "elfa health check", "check elfa api"],
  description: "Checks the health of the Elfa AI API by pinging it.",
  examples: [
    [
      {
        user: "{{user}}",
        content: {
          text: "ping elfa"
        }
      },
      {
        user: "{{agent}}",
        content: {
          text: "Elfa AI API is up and running.",
          action: "ELFA_PING"
        }
      }
    ]
  ],
  validate: async (runtime) => {
    await validateElfaAiConfig(runtime);
    return true;
  },
  handler: async (runtime, message, state, _options = {}, callback) => {
    try {
      const baseUrl = runtime.getSetting("ELFA_AI_BASE_URL");
      const headers = {
        "Content-Type": "application/json",
        "x-elfa-api-key": runtime.getSetting("ELFA_AI_API_KEY")
      };
      const response = await axios.get(`${baseUrl}/v1/ping`, { headers });
      const responseData = response.data;
      callback?.({
        text: `Elfa AI API is up and running. Response: ${JSON.stringify(
          responseData
        )}`,
        action: "ELFA_PING"
      });
      elizaLogger.info("Elfa AI API is up and running", responseData);
      return true;
    } catch (error) {
      elizaLogger.error("Failed to ping Elfa AI API", error);
      callback?.({
        text: `Elfa AI API is down. Please check the API status.
Error:
${error.message}`,
        action: "ELFA_PING"
      });
      return false;
    }
  }
};

// src/actions/apiKeyStatus.ts
import {
  elizaLogger as elizaLogger2
} from "@elizaos/core";
import axios2 from "axios";
var elfaApiKeyStatusAction = {
  name: "ELFA_API_KEY_STATUS",
  similes: ["elfa api key status", "check api key", "api key info"],
  description: "Retrieves the status and usage details of the Elfa AI API key.",
  examples: [
    [
      {
        user: "{{user}}",
        content: {
          text: "elfa api key status"
        }
      },
      {
        user: "{{agent}}",
        content: {
          text: "Elfa AI API key status retrieved successfully",
          action: "ELFA_API_KEY_STATUS"
        }
      }
    ]
  ],
  validate: async (runtime) => {
    await validateElfaAiConfig(runtime);
    return true;
  },
  handler: async (runtime, message, state, _options = {}, callback) => {
    try {
      const baseUrl = runtime.getSetting("ELFA_AI_BASE_URL");
      const headers = {
        "Content-Type": "application/json",
        "x-elfa-api-key": runtime.getSetting("ELFA_AI_API_KEY")
      };
      const response = await axios2.get(`${baseUrl}/v1/key-status`, {
        headers
      });
      const responseData = response.data;
      callback?.({
        text: `Elfa AI API key status. Response: ${JSON.stringify(
          responseData
        )}`,
        action: "ELFA_API_KEY_STATUS"
      });
      elizaLogger2.info("Elfa AI API key status", responseData);
      return true;
    } catch (error) {
      elizaLogger2.error(
        "Failed to get api key status from Elfa AI API",
        error
      );
      callback?.({
        text: `Failed to get api key status from Elfa AI. Please check the your API key.
Error:
${error.message}`,
        action: "ELFA_API_KEY_STATUS"
      });
      return false;
    }
  }
};

// src/actions/getSmartMentions.ts
import {
  ModelClass,
  composeContext,
  generateObject,
  generateText
} from "@elizaos/core";
import axios3 from "axios";
import { z as z2 } from "zod";
var getSmartMentionsSchema = z2.object({
  limit: z2.number().optional(),
  offset: z2.number().optional()
});
var getSmartMentionsTemplate = `Respond with a JSON object containing only the extracted information:

Example response:
\`\`\`json
{
    "limit": 100,
    "offset": 0
}
\`\`\`

{{recentMessages}}

Given the recent messages, extract the following information about the requested smart mentions:
- Limit: The number of smart mentions to retrieve.
- Offset: The offset to start retrieving smart mentions from.

Respond with a JSON object containing only the extracted information
`;
function isGetSmartMentionsContent(content) {
  return typeof content.limit === "number" && typeof content.offset === "number";
}
var elfaGetSmartMentions = {
  name: "ELFA_GET_SMART_MENTIONS",
  similes: ["get mentions", "smart mentions", "fetch mentions"],
  description: "Retrieves tweets by smart accounts with smart engagement from the Elfa AI API.",
  examples: [
    [
      {
        user: "{{user}}",
        content: {
          text: "get smart mentions"
        }
      },
      {
        user: "{{agent}}",
        content: {
          text: "Smart mentions retrieved successfully",
          action: "ELFA_GET_SMART_MENTIONS"
        }
      }
    ]
  ],
  validate: async (runtime) => {
    await validateElfaAiConfig(runtime);
    return true;
  },
  handler: async (runtime, message, state, _options = {}, callback) => {
    try {
      const baseUrl = runtime.getSetting("ELFA_AI_BASE_URL");
      const headers = {
        "Content-Type": "application/json",
        "x-elfa-api-key": runtime.getSetting("ELFA_AI_API_KEY")
      };
      let updatedState;
      if (!state) {
        updatedState = await runtime.composeState(message);
      } else {
        updatedState = await runtime.updateRecentMessageState(state);
      }
      const context = composeContext({
        state: updatedState,
        template: getSmartMentionsTemplate
      });
      const content = (await generateObject({
        runtime,
        context,
        modelClass: ModelClass.LARGE,
        schema: getSmartMentionsSchema,
        schemaName: "GetSmartMentionsSchema",
        schemaDescription: "Schema for getting smart mentions from Elfa AI API"
      })).object;
      if (!isGetSmartMentionsContent(content)) {
        callback?.({
          text: "Unable to process get smart mentions request. Invalid content provided.",
          content: { error: "Invalid get smart mentions content" }
        });
        return false;
      }
      const { limit = 100, offset = 0 } = content;
      const response = await axios3.get(`${baseUrl}/v1/mentions`, {
        headers,
        params: { limit, offset }
      });
      const responseData = response.data;
      const prompt = `Extracted information and summarize the smart mentions from the Elfa AI API.:
            ${JSON.stringify(responseData, null, 2)}`;
      const callbackMessage = await generateText({
        runtime,
        context: prompt,
        modelClass: ModelClass.LARGE
      });
      callback?.({
        text: `Retrieves tweets by smart accounts with smart engagement from the Elfa AI API:
${callbackMessage}
------------------------------------------------
Raw Response: 
${JSON.stringify(responseData, null, 2)}`,
        action: "ELFA_GET_SMART_MENTIONS"
      });
      return true;
    } catch (error) {
      callback?.({
        text: `Failed to get smart mentions from Elfa AI API.
Error:
${error.message}`,
        action: "ELFA_GET_SMART_MENTIONS"
      });
      return false;
    }
  }
};

// src/actions/getTopMentions.ts
import {
  ModelClass as ModelClass2,
  composeContext as composeContext2,
  generateObject as generateObject2,
  generateText as generateText2
} from "@elizaos/core";
import axios4 from "axios";
import { z as z3 } from "zod";
var getTopMentionsSchema = z3.object({
  ticker: z3.string().min(1),
  timeWindow: z3.string().min(2).optional(),
  page: z3.number().optional(),
  pageSize: z3.number().optional(),
  includeAccountDetails: z3.boolean().optional()
});
var getTopMentionsTemplate = `Respond with a JSON object containing only the extracted information:

Example response:
\`\`\`json
{
    "ticker": "SOL",
    "timeWindow": "1h",
    "page": 1,
    "pageSize": 10,
    "includeAccountDetails": false
}
\`\`\`

{{recentMessages}}

Given the recent messages, extract the following information about the requested top mentions:
- ticker: symbol to retrieve mentions for.
- timeWindow: Time window for mentions eg - 1h, 24h, 7d (default: 1h).
- page: Page number for pagination (default: 1).
- pageSize: Number of mentions per page (default: 10).
- includeAccountDetails: Include account details in the response (default: false).

Respond with a JSON object containing only the extracted information
`;
function isGetTopMentionsContent(content) {
  return typeof content.ticker === "string" && (content.timeWindow === void 0 || typeof content.timeWindow === "string") && (content.page === void 0 || typeof content.page === "number") && (content.pageSize === void 0 || typeof content.pageSize === "number") && (content.includeAccountDetails === void 0 || typeof content.includeAccountDetails === "boolean");
}
var elfaGetTopMentionsAction = {
  name: "ELFA_GET_TOP_MENTIONS",
  similes: [
    "top mentions",
    "get top mentions",
    "fetch top mentions",
    "get top tweets"
  ],
  description: "Retrieves top tweets for a given ticker symbol from the Elfa AI API.",
  examples: [
    [
      {
        user: "{{user}}",
        content: {
          text: "get top mentions for SOL"
        }
      },
      {
        user: "{{agent}}",
        content: {
          text: "Top mentions for the ticker SOL are retrieved.",
          action: "ELFA_GET_TOP_MENTIONS"
        }
      }
    ]
  ],
  validate: async (runtime) => {
    await validateElfaAiConfig(runtime);
    return true;
  },
  handler: async (runtime, message, state, _options = {}, callback) => {
    try {
      const baseUrl = runtime.getSetting("ELFA_AI_BASE_URL");
      const headers = {
        "Content-Type": "application/json",
        "x-elfa-api-key": runtime.getSetting("ELFA_AI_API_KEY")
      };
      let updatedState;
      if (!state) {
        updatedState = await runtime.composeState(message);
      } else {
        updatedState = await runtime.updateRecentMessageState(state);
      }
      const context = composeContext2({
        state: updatedState,
        template: getTopMentionsTemplate
      });
      const content = (await generateObject2({
        runtime,
        context,
        modelClass: ModelClass2.LARGE,
        schema: getTopMentionsSchema,
        schemaName: "GetTopMentionsSchema",
        schemaDescription: "Schema for getting top mentions for a specific ticker from Elfa AI API"
      })).object;
      if (!isGetTopMentionsContent(content)) {
        callback?.({
          text: "Unable to process get top mentions for the requested ticker. Invalid content provided.",
          content: { error: "Invalid get top mentions content" }
        });
        return false;
      }
      const {
        ticker,
        timeWindow = "1h",
        page = 1,
        pageSize = 10,
        includeAccountDetails = false
      } = content;
      const response = await axios4.get(`${baseUrl}/v1/top-mentions`, {
        headers,
        params: {
          ticker,
          timeWindow,
          page,
          pageSize,
          includeAccountDetails
        }
      });
      const responseData = response.data;
      const prompt = `Extracted information and summarize the top tweets for a specific ticker from the Elfa AI API. Make sure you mention details of the tweet such as date, post metrics and the tweet content:
            ${JSON.stringify(responseData, null, 2)}`;
      const callbackMessage = await generateText2({
        runtime,
        context: prompt,
        modelClass: ModelClass2.LARGE
      });
      callback?.({
        text: `Retrieved top tweets for the ${ticker}:
${callbackMessage}
------------------------------------------------
Raw Response: 
${JSON.stringify(responseData, null, 2)}`,
        action: "ELFA_GET_TOP_MENTIONS"
      });
      return true;
    } catch (error) {
      callback?.({
        text: `Failed to get top mentions for provided ticker from Elfa AI API.
Error:
${error.message}`,
        action: "ELFA_GET_TOP_MENTIONS"
      });
      return false;
    }
  }
};

// src/actions/getSearchMentionsByKeywords.ts
import {
  ModelClass as ModelClass3,
  composeContext as composeContext3,
  generateObject as generateObject3,
  generateText as generateText3
} from "@elizaos/core";
import axios5 from "axios";
import { z as z4 } from "zod";
var getSearchMentionsByKeywordsSchema = z4.object({
  keywords: z4.string().min(1),
  from: z4.number(),
  to: z4.number(),
  limit: z4.number().optional()
});
var getSearchMentionsByKeywordsTemplate = `Respond with a JSON object containing only the extracted information:

Example response:
\`\`\`json
{
    "keywords": "ai agents",
    "from": 1738675001,
    "to": 1738775001,
    limit: 20
}
\`\`\`

{{recentMessages}}

Given the recent messages, extract the following information about the requested search mentions by keywords:
- keywords: Keywords to search for, separated by commas.
- from: Start date as unix timestamp.
- to: End date as unix timestamp.
- limit: Number of tweets to retrieve (default: 20).

Respond with a JSON object containing only the extracted information
`;
function isGetSearchMentionsByKeywordsContent(content) {
  return typeof content.keywords === "string" && typeof content.from === "number" && typeof content.to === "number" && (typeof content.limit === "number" || content.limit === void 0);
}
var elfaGetSearchMentionsByKeywordsAction = {
  name: "ELFA_SEARCH_MENTIONS_BY_KEYWORDS",
  similes: [
    "search mentions",
    "find mentions by keywords",
    "tweets by keywords"
  ],
  description: "Searches for tweets by keywords within a specified date range using the Elfa AI API.",
  examples: [
    [
      {
        user: "{{user}}",
        content: {
          text: "search mentions for ai agents between 1738675001 and 1738775001"
        }
      },
      {
        user: "{{agent}}",
        content: {
          text: "Search mentions by keywords completed successfully",
          action: "ELFA_SEARCH_MENTIONS_BY_KEYWORDS"
        }
      }
    ]
  ],
  validate: async (runtime) => {
    await validateElfaAiConfig(runtime);
    return true;
  },
  handler: async (runtime, message, state, _options = {}, callback) => {
    try {
      const baseUrl = runtime.getSetting("ELFA_AI_BASE_URL");
      const headers = {
        "Content-Type": "application/json",
        "x-elfa-api-key": runtime.getSetting("ELFA_AI_API_KEY")
      };
      let updatedState;
      if (!state) {
        updatedState = await runtime.composeState(message);
      } else {
        updatedState = await runtime.updateRecentMessageState(state);
      }
      const context = composeContext3({
        state: updatedState,
        template: getSearchMentionsByKeywordsTemplate
      });
      const content = (await generateObject3({
        runtime,
        context,
        modelClass: ModelClass3.LARGE,
        schema: getSearchMentionsByKeywordsSchema,
        schemaName: "getSearchMentionsByKeywordsSchema",
        schemaDescription: "Schema for searching for tweets by keywords within a specified date range using the Elfa AI API"
      })).object;
      if (!isGetSearchMentionsByKeywordsContent(content)) {
        callback?.({
          text: "Unable to search for tweets by the keywords provided. Invalid content provided.",
          content: {
            error: "Invalid get search mentions by keywords content"
          }
        });
        return false;
      }
      const { keywords, from, to, limit = 20 } = content;
      const response = await axios5.get(`${baseUrl}/v1/mentions/search`, {
        headers,
        params: {
          keywords,
          from,
          to,
          limit
        }
      });
      const responseData = response.data;
      const prompt = `Extracted information and summarize the tweets for keywords from the Elfa AI API. Make sure you mention details of the tweet such as date, post metrics and the tweet content:
            ${JSON.stringify(responseData, null, 2)}`;
      const callbackMessage = await generateText3({
        runtime,
        context: prompt,
        modelClass: ModelClass3.LARGE
      });
      callback?.({
        text: `Retrieved tweets for the ${keywords} keywords from the Elfa AI API:
${callbackMessage}
------------------------------------------------
Raw Response: 
${JSON.stringify(responseData, null, 2)}`,
        action: "ELFA_SEARCH_MENTIONS_BY_KEYWORDS"
      });
      return true;
    } catch (error) {
      callback?.({
        text: `Failed to get tweets for the mentioned keywords from Elfa AI API.
Error:
${error.message}`,
        action: "ELFA_SEARCH_MENTIONS_BY_KEYWORDS"
      });
      return false;
    }
  }
};

// src/actions/getTrendingTokens.ts
import {
  ModelClass as ModelClass4,
  composeContext as composeContext4,
  generateObject as generateObject4,
  generateText as generateText4
} from "@elizaos/core";
import axios6 from "axios";
import { z as z5 } from "zod";
var getTrendingTokensSchema = z5.object({
  timeWindow: z5.string().min(2).optional(),
  page: z5.number().optional(),
  pageSize: z5.number().optional(),
  minMentions: z5.number().optional()
});
var getTrendingTokensTemplate = `Respond with a JSON object containing only the extracted information:

Example response:
\`\`\`json
{
    "timeWindow": "24h",
    "page": 1,
    "pageSize": 50,
    "minMentions": 5
}
\`\`\`

{{recentMessages}}

Given the recent messages, extract the following information about the trending tokens:
- timeWindow: Time window for mentions.
- page: Page number for pagination.
- pageSize: Number of tokens per page.
- minMentions: Minimum number of mentions for a token to be considered trending.

Respond with a JSON object containing only the extracted information
`;
function isGetTrendingTokensContent(content) {
  return typeof content.timeWindow === "string" || typeof content.timeWindow === void 0 && typeof content.page === "number" || typeof content.page === void 0 && typeof content.pageSize === "number" || typeof content.pageSize === void 0 && typeof content.minMentions === "number" || typeof content.minMentions === void 0;
}
var elfaGetTrendingTokens = {
  name: "ELFA_GET_TRENDING_TOKENS",
  similes: [
    "trending tokens",
    "get trending tokens",
    "fetch trending tokens"
  ],
  description: "Retrieves trending tokens based on mentions from the Elfa AI API.",
  examples: [
    [
      {
        user: "{{user}}",
        content: {
          text: "get trending tokens"
        }
      },
      {
        user: "{{agent}}",
        content: {
          text: "ternding tokens retrieved successfully",
          action: "ELFA_GET_TRENDING_TOKENS"
        }
      }
    ]
  ],
  validate: async (runtime) => {
    await validateElfaAiConfig(runtime);
    return true;
  },
  handler: async (runtime, message, state, _options = {}, callback) => {
    try {
      const baseUrl = runtime.getSetting("ELFA_AI_BASE_URL");
      const headers = {
        "Content-Type": "application/json",
        "x-elfa-api-key": runtime.getSetting("ELFA_AI_API_KEY")
      };
      let updatedState;
      if (!state) {
        updatedState = await runtime.composeState(message);
      } else {
        updatedState = await runtime.updateRecentMessageState(state);
      }
      const context = composeContext4({
        state: updatedState,
        template: getTrendingTokensTemplate
      });
      const content = (await generateObject4({
        runtime,
        context,
        modelClass: ModelClass4.LARGE,
        schema: getTrendingTokensSchema,
        schemaName: "getTrendingTokensSchema",
        schemaDescription: "Schema for getting trending tokens based on mentions from Elfa AI API"
      })).object;
      if (!isGetTrendingTokensContent(content)) {
        callback?.({
          text: "Unable to process get trending tokens request. Invalid content provided.",
          content: { error: "Invalid get trending tokens content" }
        });
        return false;
      }
      const {
        timeWindow = "24h",
        page = 1,
        pageSize = 50,
        minMentions = 5
      } = content;
      const response = await axios6.get(`${baseUrl}/v1/trending-tokens`, {
        headers,
        params: { timeWindow, page, pageSize, minMentions }
      });
      const responseData = response.data;
      const prompt = `Extracted information and summarize the trending tokens by twitter mentions from the Elfa AI API.:
            ${JSON.stringify(responseData, null, 2)}`;
      const callbackMessage = await generateText4({
        runtime,
        context: prompt,
        modelClass: ModelClass4.LARGE
      });
      callback?.({
        text: `Retrieves trending tokens by twitter mentions from the Elfa AI API:
${callbackMessage}
------------------------------------------------
Raw Response: 
${JSON.stringify(responseData, null, 2)}`,
        action: "ELFA_GET_TRENDING_TOKENS"
      });
      return true;
    } catch (error) {
      callback?.({
        text: `Failed to get trending tokens from Elfa AI API.
Error:
${error.message}`,
        action: "ELFA_GET_TRENDING_TOKENS"
      });
      return false;
    }
  }
};

// src/actions/getTwitterAccountStats.ts
import {
  ModelClass as ModelClass5,
  composeContext as composeContext5,
  generateObject as generateObject5,
  generateText as generateText5
} from "@elizaos/core";
import axios7 from "axios";
import { z as z6 } from "zod";
var getTwitterAccountStatsSchema = z6.object({
  username: z6.string().min(1)
});
var getTwitterAccountStatsTemplate = `Respond with a JSON object containing only the extracted information:

Example response:
\`\`\`json
{
    "username": "elonmusk",
}
\`\`\`

{{recentMessages}}

Given the recent messages, extract the following information for the requested Twitter account smart stats:
- username: Twitter username to retrieve smart account stats for.

Respond with a JSON object containing only the extracted information
`;
function isGetTwitterAccountStatsContent(content) {
  return typeof content.username === "string";
}
var elfaGetTwitterAccountStatsAction = {
  name: "ELFA_TWITTER_ACCOUNT_STATS",
  similes: [
    "account smart stats",
    "smart stats",
    "twitter account stats",
    "smart twitter stats"
  ],
  description: "Retrieves smart stats and social metrics for a specified Twitter account from the Elfa AI API.",
  examples: [
    [
      {
        user: "{{user}}",
        content: {
          text: "get smart stats for Twitter account"
        }
      },
      {
        user: "{{agent}}",
        content: {
          text: "Retrieved twitter account data completed successfully",
          action: "ELFA_TWITTER_ACCOUNT_STATS"
        }
      }
    ]
  ],
  validate: async (runtime) => {
    await validateElfaAiConfig(runtime);
    return true;
  },
  handler: async (runtime, message, state, _options = {}, callback) => {
    try {
      const baseUrl = runtime.getSetting("ELFA_AI_BASE_URL");
      const headers = {
        "Content-Type": "application/json",
        "x-elfa-api-key": runtime.getSetting("ELFA_AI_API_KEY")
      };
      let updatedState;
      if (!state) {
        updatedState = await runtime.composeState(message);
      } else {
        updatedState = await runtime.updateRecentMessageState(state);
      }
      const context = composeContext5({
        state: updatedState,
        template: getTwitterAccountStatsTemplate
      });
      const content = (await generateObject5({
        runtime,
        context,
        modelClass: ModelClass5.LARGE,
        schema: getTwitterAccountStatsSchema,
        schemaName: "getTwitterAccountStatsSchema",
        schemaDescription: "Schema for retrieving smart twitter account stats for a specific username using the Elfa AI API"
      })).object;
      if (!isGetTwitterAccountStatsContent(content)) {
        callback?.({
          text: "Unable to retieve twitter account stats for the provided username. Invalid content provided.",
          content: {
            error: "Invalid get twitter account stats content"
          }
        });
        return false;
      }
      const { username } = content;
      const response = await axios7.get(
        `${baseUrl}/v1/account/smart-stats`,
        {
          headers,
          params: {
            username
          }
        }
      );
      const responseData = response.data;
      const prompt = `Extracted information and summarize the smart account stats for provided username ${username}:
            ${JSON.stringify(responseData, null, 2)}`;
      const callbackMessage = await generateText5({
        runtime,
        context: prompt,
        modelClass: ModelClass5.LARGE
      });
      callback?.({
        text: `Retrieved twitter account data for ${username} from the Elfa AI API:
${callbackMessage}
------------------------------------------------
Raw Response: 
${JSON.stringify(responseData, null, 2)}`,
        action: "ELFA_TWITTER_ACCOUNT_STATS"
      });
      return true;
    } catch (error) {
      callback?.({
        text: `Failed to get twitter account data for the mentioned username from Elfa AI API.
Error:
${error.message}`,
        action: "ELFA_TWITTER_ACCOUNT_STATS"
      });
      return false;
    }
  }
};

// src/index.ts
var elfaAiPlugin = {
  name: "elfa-ai",
  description: "Integrates Elfa AI API into Eliza OS for social media analytics and insights.",
  actions: [
    elfaPingAction,
    elfaApiKeyStatusAction,
    elfaGetSmartMentions,
    elfaGetTopMentionsAction,
    elfaGetSearchMentionsByKeywordsAction,
    elfaGetTrendingTokens,
    elfaGetTwitterAccountStatsAction
  ]
};
var index_default = elfaAiPlugin;
export {
  index_default as default,
  elfaAiPlugin
};
//# sourceMappingURL=index.js.map