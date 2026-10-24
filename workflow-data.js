window.workflowGraphs = {
  "support": {
    "name": "Support Auto-Responder (Human Approval)",
    "activeInExport": false,
    "configuration": {},
    "nodes": [
      {
        "name": "Support Ticket Webhook",
        "type": "n8n-nodes-base.webhook",
        "position": [
          304,
          192
        ],
        "disabled": false,
        "parameterKeys": [
          "httpMethod",
          "options",
          "path",
          "responseMode"
        ],
        "credentialTypes": []
      },
      {
        "name": "Normalize Ticket",
        "type": "n8n-nodes-base.set",
        "position": [
          448,
          320
        ],
        "disabled": false,
        "parameterKeys": [
          "assignments",
          "options"
        ],
        "credentialTypes": []
      },
      {
        "name": "Acknowledge Ticket",
        "type": "n8n-nodes-base.respondToWebhook",
        "position": [
          624,
          192
        ],
        "disabled": false,
        "parameterKeys": [
          "options",
          "respondWith",
          "responseBody"
        ],
        "credentialTypes": []
      },
      {
        "name": "Classify And Draft Reply",
        "type": "@n8n/n8n-nodes-langchain.googleGemini",
        "position": [
          608,
          400
        ],
        "disabled": false,
        "parameterKeys": [
          "builtInTools",
          "jsonOutput",
          "messages",
          "modelId",
          "options"
        ],
        "credentialTypes": [
          "Google Gemini credentials (not verified)"
        ]
      },
      {
        "name": "Parse AI Draft",
        "type": "n8n-nodes-base.code",
        "position": [
          912,
          400
        ],
        "disabled": false,
        "parameterKeys": [
          "jsCode"
        ],
        "credentialTypes": []
      },
      {
        "name": "Ask Human To Approve",
        "type": "n8n-nodes-base.telegram",
        "position": [
          1136,
          400
        ],
        "disabled": false,
        "parameterKeys": [
          "approvalOptions",
          "chatId",
          "message",
          "operation",
          "options"
        ],
        "credentialTypes": [
          "Telegram credentials (not verified)"
        ]
      },
      {
        "name": "Was Approved?",
        "type": "n8n-nodes-base.if",
        "position": [
          1344,
          400
        ],
        "disabled": false,
        "parameterKeys": [
          "conditions",
          "looseTypeValidation",
          "options"
        ],
        "credentialTypes": []
      },
      {
        "name": "Email Reply To Customer",
        "type": "n8n-nodes-base.emailSend",
        "position": [
          1520,
          256
        ],
        "disabled": false,
        "parameterKeys": [
          "emailFormat",
          "fromEmail",
          "options",
          "subject",
          "text",
          "toEmail"
        ],
        "credentialTypes": []
      },
      {
        "name": "Log Ticket As Sent",
        "type": "n8n-nodes-base.dataTable",
        "position": [
          1728,
          256
        ],
        "disabled": false,
        "parameterKeys": [
          "columns",
          "dataTableId",
          "options"
        ],
        "credentialTypes": []
      },
      {
        "name": "Log Ticket As Rejected",
        "type": "n8n-nodes-base.dataTable",
        "position": [
          1536,
          528
        ],
        "disabled": false,
        "parameterKeys": [
          "columns",
          "dataTableId",
          "options"
        ],
        "credentialTypes": []
      },
      {
        "name": "AI Agent Tool",
        "type": "@n8n/n8n-nodes-langchain.agentTool",
        "position": [
          528,
          544
        ],
        "disabled": false,
        "parameterKeys": [
          "options"
        ],
        "credentialTypes": []
      },
      {
        "name": "Ollama Chat Model",
        "type": "@n8n/n8n-nodes-langchain.lmChatOllama",
        "position": [
          528,
          704
        ],
        "disabled": false,
        "parameterKeys": [
          "options"
        ],
        "credentialTypes": []
      }
    ],
    "edges": [
      {
        "from": "Support Ticket Webhook",
        "to": "Normalize Ticket",
        "type": "main",
        "outputIndex": 0,
        "label": "Output 1"
      },
      {
        "from": "Normalize Ticket",
        "to": "Acknowledge Ticket",
        "type": "main",
        "outputIndex": 0,
        "label": "Output 1"
      },
      {
        "from": "Normalize Ticket",
        "to": "Classify And Draft Reply",
        "type": "main",
        "outputIndex": 0,
        "label": "Output 1"
      },
      {
        "from": "Classify And Draft Reply",
        "to": "Parse AI Draft",
        "type": "main",
        "outputIndex": 0,
        "label": "Output 1"
      },
      {
        "from": "Parse AI Draft",
        "to": "Ask Human To Approve",
        "type": "main",
        "outputIndex": 0,
        "label": "Output 1"
      },
      {
        "from": "Ask Human To Approve",
        "to": "Was Approved?",
        "type": "main",
        "outputIndex": 0,
        "label": "Output 1"
      },
      {
        "from": "Was Approved?",
        "to": "Email Reply To Customer",
        "type": "main",
        "outputIndex": 0,
        "label": "True"
      },
      {
        "from": "Was Approved?",
        "to": "Log Ticket As Rejected",
        "type": "main",
        "outputIndex": 1,
        "label": "False"
      },
      {
        "from": "Email Reply To Customer",
        "to": "Log Ticket As Sent",
        "type": "main",
        "outputIndex": 0,
        "label": "Output 1"
      },
      {
        "from": "AI Agent Tool",
        "to": "Classify And Draft Reply",
        "type": "ai_tool",
        "outputIndex": 0,
        "label": "Output 1"
      },
      {
        "from": "Ollama Chat Model",
        "to": "AI Agent Tool",
        "type": "ai_languageModel",
        "outputIndex": 0,
        "label": "Output 1"
      }
    ]
  },
  "video": {
    "name": "Video-Generator (Gemini copy)",
    "activeInExport": true,
    "configuration": {
      "image_generation_enabled": false,
      "video_generation_enabled": false
    },
    "nodes": [
      {
        "name": "Config",
        "type": "n8n-nodes-base.set",
        "position": [
          -2160,
          16
        ],
        "disabled": false,
        "parameterKeys": [
          "assignments",
          "includeOtherFields",
          "options"
        ],
        "credentialTypes": []
      },
      {
        "name": "Telegram Trigger",
        "type": "n8n-nodes-base.telegramTrigger",
        "position": [
          -2880,
          16
        ],
        "disabled": false,
        "parameterKeys": [
          "additionalFields",
          "updates"
        ],
        "credentialTypes": [
          "Telegram credentials (not verified)"
        ]
      },
      {
        "name": "Dedupe Update",
        "type": "n8n-nodes-base.code",
        "position": [
          -2720,
          16
        ],
        "disabled": false,
        "parameterKeys": [
          "jsCode"
        ],
        "credentialTypes": []
      },
      {
        "name": "Normalize Telegram Input",
        "type": "n8n-nodes-base.code",
        "position": [
          -2560,
          16
        ],
        "disabled": false,
        "parameterKeys": [
          "jsCode"
        ],
        "credentialTypes": []
      },
      {
        "name": "Supported Input?",
        "type": "n8n-nodes-base.if",
        "position": [
          -2528,
          -176
        ],
        "disabled": false,
        "parameterKeys": [
          "conditions",
          "options"
        ],
        "credentialTypes": []
      },
      {
        "name": "Reply Unsupported",
        "type": "n8n-nodes-base.telegram",
        "position": [
          -1968,
          -144
        ],
        "disabled": false,
        "parameterKeys": [
          "additionalFields",
          "chatId",
          "text"
        ],
        "credentialTypes": [
          "Telegram credentials (not verified)"
        ]
      },
      {
        "name": "Authorized?",
        "type": "n8n-nodes-base.if",
        "position": [
          -2352,
          -144
        ],
        "disabled": false,
        "parameterKeys": [
          "conditions",
          "options"
        ],
        "credentialTypes": []
      },
      {
        "name": "Setup Needed?",
        "type": "n8n-nodes-base.if",
        "position": [
          -2288,
          272
        ],
        "disabled": false,
        "parameterKeys": [
          "conditions",
          "options"
        ],
        "credentialTypes": []
      },
      {
        "name": "Reply Setup Needed",
        "type": "n8n-nodes-base.telegram",
        "position": [
          -2048,
          272
        ],
        "disabled": false,
        "parameterKeys": [
          "additionalFields",
          "chatId",
          "text"
        ],
        "credentialTypes": [
          "Telegram credentials (not verified)"
        ]
      },
      {
        "name": "Is Callback?",
        "type": "n8n-nodes-base.if",
        "position": [
          -2160,
          -208
        ],
        "disabled": false,
        "parameterKeys": [
          "conditions",
          "options"
        ],
        "credentialTypes": []
      },
      {
        "name": "Answer Callback",
        "type": "n8n-nodes-base.telegram",
        "position": [
          -1936,
          -368
        ],
        "disabled": false,
        "parameterKeys": [
          "additionalFields",
          "queryId",
          "resource"
        ],
        "credentialTypes": [
          "Telegram credentials (not verified)"
        ]
      },
      {
        "name": "Parse Callback",
        "type": "n8n-nodes-base.code",
        "position": [
          -1728,
          -368
        ],
        "disabled": false,
        "parameterKeys": [
          "jsCode"
        ],
        "credentialTypes": []
      },
      {
        "name": "Load Approval",
        "type": "n8n-nodes-base.supabase",
        "position": [
          -1504,
          -368
        ],
        "disabled": false,
        "parameterKeys": [
          "filterString",
          "filterType",
          "operation",
          "returnAll",
          "tableId"
        ],
        "credentialTypes": [
          "Supabase credentials (not verified)"
        ]
      },
      {
        "name": "Load Approval Project",
        "type": "n8n-nodes-base.supabase",
        "position": [
          -1280,
          -368
        ],
        "disabled": false,
        "parameterKeys": [
          "filterString",
          "filterType",
          "operation",
          "returnAll",
          "tableId"
        ],
        "credentialTypes": [
          "Supabase credentials (not verified)"
        ]
      },
      {
        "name": "Validate Callback",
        "type": "n8n-nodes-base.code",
        "position": [
          -1056,
          -368
        ],
        "disabled": false,
        "parameterKeys": [
          "jsCode"
        ],
        "credentialTypes": []
      },
      {
        "name": "Callback Valid?",
        "type": "n8n-nodes-base.if",
        "position": [
          -848,
          -368
        ],
        "disabled": false,
        "parameterKeys": [
          "conditions",
          "options"
        ],
        "credentialTypes": []
      },
      {
        "name": "Reply Stale",
        "type": "n8n-nodes-base.telegram",
        "position": [
          -624,
          -224
        ],
        "disabled": false,
        "parameterKeys": [
          "additionalFields",
          "chatId",
          "text"
        ],
        "credentialTypes": [
          "Telegram credentials (not verified)"
        ]
      },
      {
        "name": "Decision Plan",
        "type": "n8n-nodes-base.code",
        "position": [
          -624,
          -448
        ],
        "disabled": false,
        "parameterKeys": [
          "jsCode"
        ],
        "credentialTypes": []
      },
      {
        "name": "Update Approval",
        "type": "n8n-nodes-base.supabase",
        "position": [
          -400,
          -448
        ],
        "disabled": false,
        "parameterKeys": [
          "fieldsUi",
          "filterString",
          "filterType",
          "operation",
          "tableId"
        ],
        "credentialTypes": [
          "Supabase credentials (not verified)"
        ]
      },
      {
        "name": "Update Project Status",
        "type": "n8n-nodes-base.supabase",
        "position": [
          -176,
          -448
        ],
        "disabled": false,
        "parameterKeys": [
          "fieldsUi",
          "filterString",
          "filterType",
          "operation",
          "tableId"
        ],
        "credentialTypes": [
          "Supabase credentials (not verified)"
        ]
      },
      {
        "name": "Reply Decision",
        "type": "n8n-nodes-base.telegram",
        "position": [
          48,
          -448
        ],
        "disabled": false,
        "parameterKeys": [
          "additionalFields",
          "chatId",
          "text"
        ],
        "credentialTypes": [
          "Telegram credentials (not verified)"
        ]
      },
      {
        "name": "Scenes Approved?",
        "type": "n8n-nodes-base.if",
        "position": [
          272,
          -448
        ],
        "disabled": false,
        "parameterKeys": [
          "conditions",
          "options"
        ],
        "credentialTypes": []
      },
      {
        "name": "Approve Scenes",
        "type": "n8n-nodes-base.supabase",
        "position": [
          480,
          -528
        ],
        "disabled": false,
        "parameterKeys": [
          "fieldsUi",
          "filterString",
          "filterType",
          "operation",
          "tableId"
        ],
        "credentialTypes": [
          "Supabase credentials (not verified)"
        ]
      },
      {
        "name": "Resume Context",
        "type": "n8n-nodes-base.code",
        "position": [
          704,
          -528
        ],
        "disabled": false,
        "parameterKeys": [
          "jsCode"
        ],
        "credentialTypes": []
      },
      {
        "name": "Video Approved?",
        "type": "n8n-nodes-base.if",
        "position": [
          480,
          -368
        ],
        "disabled": false,
        "parameterKeys": [
          "conditions",
          "options"
        ],
        "credentialTypes": []
      },
      {
        "name": "Approve Video",
        "type": "n8n-nodes-base.supabase",
        "position": [
          704,
          -368
        ],
        "disabled": false,
        "parameterKeys": [
          "fieldsUi",
          "filterString",
          "filterType",
          "operation",
          "tableId"
        ],
        "credentialTypes": [
          "Supabase credentials (not verified)"
        ]
      },
      {
        "name": "Has Voice?",
        "type": "n8n-nodes-base.if",
        "position": [
          -1936,
          16
        ],
        "disabled": false,
        "parameterKeys": [
          "conditions",
          "options"
        ],
        "credentialTypes": []
      },
      {
        "name": "Get Voice File",
        "type": "n8n-nodes-base.telegram",
        "position": [
          -1936,
          192
        ],
        "disabled": false,
        "parameterKeys": [
          "additionalFields",
          "fileId",
          "resource"
        ],
        "credentialTypes": [
          "Telegram credentials (not verified)"
        ]
      },
      {
        "name": "Encode Voice",
        "type": "n8n-nodes-base.code",
        "position": [
          -1728,
          192
        ],
        "disabled": false,
        "parameterKeys": [
          "jsCode"
        ],
        "credentialTypes": []
      },
      {
        "name": "Transcribe Voice",
        "type": "n8n-nodes-base.httpRequest",
        "position": [
          -1504,
          192
        ],
        "disabled": false,
        "parameterKeys": [
          "authentication",
          "headerParameters",
          "jsonBody",
          "method",
          "nodeCredentialType",
          "options",
          "sendBody",
          "sendHeaders",
          "specifyBody",
          "url"
        ],
        "credentialTypes": [
          "Google Gemini credentials (not verified)"
        ]
      },
      {
        "name": "Merge Transcript",
        "type": "n8n-nodes-base.code",
        "position": [
          -1280,
          192
        ],
        "disabled": false,
        "parameterKeys": [
          "jsCode"
        ],
        "credentialTypes": []
      },
      {
        "name": "Transcript OK?",
        "type": "n8n-nodes-base.if",
        "position": [
          -1056,
          192
        ],
        "disabled": false,
        "parameterKeys": [
          "conditions",
          "options"
        ],
        "credentialTypes": []
      },
      {
        "name": "Reply Voice Failed",
        "type": "n8n-nodes-base.telegram",
        "position": [
          -848,
          352
        ],
        "disabled": false,
        "parameterKeys": [
          "additionalFields",
          "chatId",
          "text"
        ],
        "credentialTypes": [
          "Telegram credentials (not verified)"
        ]
      },
      {
        "name": "Create Project",
        "type": "n8n-nodes-base.supabase",
        "position": [
          -1952,
          16
        ],
        "disabled": false,
        "parameterKeys": [
          "fieldsUi",
          "tableId"
        ],
        "credentialTypes": [
          "Supabase credentials (not verified)"
        ]
      },
      {
        "name": "Intake",
        "type": "n8n-nodes-base.code",
        "position": [
          -1760,
          16
        ],
        "disabled": false,
        "parameterKeys": [
          "jsCode"
        ],
        "credentialTypes": []
      },
      {
        "name": "Set Planning",
        "type": "n8n-nodes-base.supabase",
        "position": [
          -1600,
          16
        ],
        "disabled": false,
        "parameterKeys": [
          "fieldsUi",
          "filterString",
          "filterType",
          "operation",
          "tableId"
        ],
        "credentialTypes": [
          "Supabase credentials (not verified)"
        ]
      },
      {
        "name": "Has Link?",
        "type": "n8n-nodes-base.if",
        "position": [
          -1472,
          16
        ],
        "disabled": false,
        "parameterKeys": [
          "conditions",
          "options"
        ],
        "credentialTypes": []
      },
      {
        "name": "Has Image?",
        "type": "n8n-nodes-base.if",
        "position": [
          -1264,
          16
        ],
        "disabled": false,
        "parameterKeys": [
          "conditions",
          "options"
        ],
        "credentialTypes": []
      },
      {
        "name": "Fetch Link",
        "type": "n8n-nodes-base.httpRequest",
        "position": [
          -896,
          16
        ],
        "disabled": false,
        "parameterKeys": [
          "headerParameters",
          "options",
          "sendHeaders",
          "url"
        ],
        "credentialTypes": []
      },
      {
        "name": "Fetch Source Image",
        "type": "n8n-nodes-base.telegram",
        "position": [
          -672,
          16
        ],
        "disabled": false,
        "parameterKeys": [
          "additionalFields",
          "fileId",
          "resource"
        ],
        "credentialTypes": [
          "Telegram credentials (not verified)"
        ]
      },
      {
        "name": "Build Source Package",
        "type": "n8n-nodes-base.code",
        "position": [
          -576,
          -96
        ],
        "disabled": false,
        "parameterKeys": [
          "jsCode"
        ],
        "credentialTypes": []
      },
      {
        "name": "Source Usable?",
        "type": "n8n-nodes-base.if",
        "position": [
          -384,
          -96
        ],
        "disabled": false,
        "parameterKeys": [
          "conditions",
          "options"
        ],
        "credentialTypes": []
      },
      {
        "name": "Reply Source Needed",
        "type": "n8n-nodes-base.telegram",
        "position": [
          -384,
          128
        ],
        "disabled": false,
        "parameterKeys": [
          "additionalFields",
          "chatId",
          "text"
        ],
        "credentialTypes": [
          "Telegram credentials (not verified)"
        ]
      },
      {
        "name": "Gemini Analyst",
        "type": "@n8n/n8n-nodes-langchain.agent",
        "position": [
          -160,
          -96
        ],
        "disabled": false,
        "parameterKeys": [
          "options",
          "promptType",
          "text"
        ],
        "credentialTypes": []
      },
      {
        "name": "Gemini Analyst Model",
        "type": "@n8n/n8n-nodes-langchain.lmChatGoogleGemini",
        "position": [
          -160,
          240
        ],
        "disabled": false,
        "parameterKeys": [
          "modelName",
          "options"
        ],
        "credentialTypes": [
          "Google Gemini credentials (not verified)"
        ]
      },
      {
        "name": "Build Story Prompt",
        "type": "n8n-nodes-base.code",
        "position": [
          80,
          16
        ],
        "disabled": false,
        "parameterKeys": [
          "jsCode"
        ],
        "credentialTypes": []
      },
      {
        "name": "Gemini Story Agent",
        "type": "@n8n/n8n-nodes-langchain.agent",
        "position": [
          304,
          16
        ],
        "disabled": false,
        "parameterKeys": [
          "options",
          "promptType",
          "text"
        ],
        "credentialTypes": []
      },
      {
        "name": "Google Gemini Chat Model",
        "type": "@n8n/n8n-nodes-langchain.lmChatGoogleGemini",
        "position": [
          304,
          384
        ],
        "disabled": false,
        "parameterKeys": [
          "modelName",
          "options"
        ],
        "credentialTypes": [
          "Google Gemini credentials (not verified)"
        ]
      },
      {
        "name": "Parse Scene Plan",
        "type": "n8n-nodes-base.code",
        "position": [
          544,
          16
        ],
        "disabled": false,
        "parameterKeys": [
          "jsCode"
        ],
        "credentialTypes": []
      },
      {
        "name": "Image Gen Enabled?",
        "type": "n8n-nodes-base.if",
        "position": [
          768,
          16
        ],
        "disabled": false,
        "parameterKeys": [
          "conditions",
          "options"
        ],
        "credentialTypes": []
      },
      {
        "name": "Free.ai Image Generation (SDXL)",
        "type": "n8n-nodes-base.httpRequest",
        "position": [
          992,
          -96
        ],
        "disabled": false,
        "parameterKeys": [
          "headerParameters",
          "jsonBody",
          "method",
          "options",
          "sendBody",
          "sendHeaders",
          "specifyBody",
          "url"
        ],
        "credentialTypes": []
      },
      {
        "name": "Upload Scene Image",
        "type": "n8n-nodes-base.httpRequest",
        "position": [
          1216,
          -208
        ],
        "disabled": false,
        "parameterKeys": [
          "authentication",
          "contentType",
          "headerParameters",
          "inputDataFieldName",
          "method",
          "nodeCredentialType",
          "options",
          "sendBody",
          "sendHeaders",
          "url"
        ],
        "credentialTypes": [
          "Supabase credentials (not verified)"
        ]
      },
      {
        "name": "Send Scene Photo",
        "type": "n8n-nodes-base.telegram",
        "position": [
          1216,
          32
        ],
        "disabled": false,
        "parameterKeys": [
          "additionalFields",
          "binaryData",
          "chatId",
          "operation"
        ],
        "credentialTypes": [
          "Telegram credentials (not verified)"
        ]
      },
      {
        "name": "Prepare Scene Asset Rows",
        "type": "n8n-nodes-base.code",
        "position": [
          1792,
          -96
        ],
        "disabled": false,
        "parameterKeys": [
          "jsCode"
        ],
        "credentialTypes": []
      },
      {
        "name": "Record Scene Assets",
        "type": "n8n-nodes-base.supabase",
        "position": [
          2016,
          -96
        ],
        "disabled": false,
        "parameterKeys": [
          "dataToSend",
          "tableId"
        ],
        "credentialTypes": [
          "Supabase credentials (not verified)"
        ]
      },
      {
        "name": "Prepare Scene Rows",
        "type": "n8n-nodes-base.code",
        "position": [
          2240,
          -96
        ],
        "disabled": false,
        "parameterKeys": [
          "jsCode"
        ],
        "credentialTypes": []
      },
      {
        "name": "Prepare Storyboard Rows",
        "type": "n8n-nodes-base.code",
        "position": [
          992,
          208
        ],
        "disabled": false,
        "parameterKeys": [
          "jsCode"
        ],
        "credentialTypes": []
      },
      {
        "name": "Create Scenes",
        "type": "n8n-nodes-base.supabase",
        "position": [
          2464,
          16
        ],
        "disabled": false,
        "parameterKeys": [
          "dataToSend",
          "tableId"
        ],
        "credentialTypes": [
          "Supabase credentials (not verified)"
        ]
      },
      {
        "name": "Create Scene Approval",
        "type": "n8n-nodes-base.supabase",
        "position": [
          2688,
          16
        ],
        "disabled": false,
        "parameterKeys": [
          "fieldsUi",
          "tableId"
        ],
        "credentialTypes": [
          "Supabase credentials (not verified)"
        ]
      },
      {
        "name": "Set Awaiting Scene Approval",
        "type": "n8n-nodes-base.supabase",
        "position": [
          2912,
          16
        ],
        "disabled": false,
        "parameterKeys": [
          "fieldsUi",
          "filterString",
          "filterType",
          "operation",
          "tableId"
        ],
        "credentialTypes": [
          "Supabase credentials (not verified)"
        ]
      },
      {
        "name": "Reply Scene Approval",
        "type": "n8n-nodes-base.telegram",
        "position": [
          3136,
          16
        ],
        "disabled": false,
        "parameterKeys": [
          "additionalFields",
          "chatId",
          "inlineKeyboard",
          "replyMarkup",
          "text"
        ],
        "credentialTypes": [
          "Telegram credentials (not verified)"
        ]
      },
      {
        "name": "Build Pipeline Error",
        "type": "n8n-nodes-base.code",
        "position": [
          1216,
          512
        ],
        "disabled": false,
        "parameterKeys": [
          "jsCode"
        ],
        "credentialTypes": []
      },
      {
        "name": "Reply Pipeline Error",
        "type": "n8n-nodes-base.telegram",
        "position": [
          1440,
          512
        ],
        "disabled": false,
        "parameterKeys": [
          "additionalFields",
          "chatId",
          "text"
        ],
        "credentialTypes": [
          "Telegram credentials (not verified)"
        ]
      },
      {
        "name": "Log Error Event",
        "type": "n8n-nodes-base.supabase",
        "position": [
          1664,
          512
        ],
        "disabled": false,
        "parameterKeys": [
          "fieldsUi",
          "tableId"
        ],
        "credentialTypes": [
          "Supabase credentials (not verified)"
        ]
      },
      {
        "name": "Mark Project Failed",
        "type": "n8n-nodes-base.supabase",
        "position": [
          1888,
          512
        ],
        "disabled": false,
        "parameterKeys": [
          "fieldsUi",
          "filterString",
          "filterType",
          "operation",
          "tableId"
        ],
        "credentialTypes": [
          "Supabase credentials (not verified)"
        ]
      },
      {
        "name": "Gemini Video Agent Model",
        "type": "@n8n/n8n-nodes-langchain.lmChatGoogleGemini",
        "position": [
          2544,
          2080
        ],
        "disabled": false,
        "parameterKeys": [
          "modelName",
          "options"
        ],
        "credentialTypes": [
          "Google Gemini credentials (not verified)"
        ]
      },
      {
        "name": "Video Agent",
        "type": "@n8n/n8n-nodes-langchain.agent",
        "position": [
          2512,
          1824
        ],
        "disabled": false,
        "parameterKeys": [
          "options",
          "promptType",
          "text"
        ],
        "credentialTypes": []
      },
      {
        "name": "Claim Project",
        "type": "n8n-nodes-base.supabase",
        "position": [
          -1232,
          1024
        ],
        "disabled": false,
        "parameterKeys": [
          "fieldsUi",
          "filterString",
          "filterType",
          "operation",
          "tableId"
        ],
        "credentialTypes": [
          "Supabase credentials (not verified)"
        ]
      },
      {
        "name": "Claimed?",
        "type": "n8n-nodes-base.if",
        "position": [
          -1008,
          1024
        ],
        "disabled": false,
        "parameterKeys": [
          "conditions",
          "options"
        ],
        "credentialTypes": []
      },
      {
        "name": "Reply Not Eligible",
        "type": "n8n-nodes-base.telegram",
        "position": [
          -784,
          1184
        ],
        "disabled": false,
        "parameterKeys": [
          "additionalFields",
          "chatId",
          "text"
        ],
        "credentialTypes": [
          "Telegram credentials (not verified)"
        ]
      },
      {
        "name": "Reset Failed Tasks",
        "type": "n8n-nodes-base.supabase",
        "position": [
          -784,
          1024
        ],
        "disabled": false,
        "parameterKeys": [
          "filterString",
          "filterType",
          "operation",
          "tableId"
        ],
        "credentialTypes": [
          "Supabase credentials (not verified)"
        ]
      },
      {
        "name": "Load Settings",
        "type": "n8n-nodes-base.supabase",
        "position": [
          -640,
          800
        ],
        "disabled": false,
        "parameterKeys": [
          "filterString",
          "filterType",
          "operation",
          "returnAll",
          "tableId"
        ],
        "credentialTypes": [
          "Supabase credentials (not verified)"
        ]
      },
      {
        "name": "Load Approved Scenes",
        "type": "n8n-nodes-base.supabase",
        "position": [
          -480,
          1008
        ],
        "disabled": false,
        "parameterKeys": [
          "filterString",
          "filterType",
          "operation",
          "returnAll",
          "tableId"
        ],
        "credentialTypes": [
          "Supabase credentials (not verified)"
        ]
      },
      {
        "name": "Load Scene Assets",
        "type": "n8n-nodes-base.supabase",
        "position": [
          -352,
          816
        ],
        "disabled": false,
        "parameterKeys": [
          "filterString",
          "filterType",
          "operation",
          "returnAll",
          "tableId"
        ],
        "credentialTypes": [
          "Supabase credentials (not verified)"
        ]
      },
      {
        "name": "Build Job",
        "type": "n8n-nodes-base.code",
        "position": [
          96,
          928
        ],
        "disabled": false,
        "parameterKeys": [
          "jsCode"
        ],
        "credentialTypes": []
      },
      {
        "name": "Job OK?",
        "type": "n8n-nodes-base.if",
        "position": [
          304,
          928
        ],
        "disabled": false,
        "parameterKeys": [
          "conditions",
          "options"
        ],
        "credentialTypes": []
      },
      {
        "name": "Failure Info",
        "type": "n8n-nodes-base.code",
        "position": [
          528,
          736
        ],
        "disabled": false,
        "parameterKeys": [
          "jsCode"
        ],
        "credentialTypes": []
      },
      {
        "name": "Fail Project",
        "type": "n8n-nodes-base.supabase",
        "position": [
          752,
          736
        ],
        "disabled": false,
        "parameterKeys": [
          "fieldsUi",
          "filterString",
          "filterType",
          "operation",
          "tableId"
        ],
        "credentialTypes": [
          "Supabase credentials (not verified)"
        ]
      },
      {
        "name": "Reply Failure",
        "type": "n8n-nodes-base.telegram",
        "position": [
          976,
          736
        ],
        "disabled": false,
        "parameterKeys": [
          "additionalFields",
          "chatId",
          "text"
        ],
        "credentialTypes": [
          "Telegram credentials (not verified)"
        ]
      },
      {
        "name": "Split Scenes",
        "type": "n8n-nodes-base.code",
        "position": [
          528,
          1024
        ],
        "disabled": false,
        "parameterKeys": [
          "jsCode"
        ],
        "credentialTypes": []
      },
      {
        "name": "Loop Over Scenes",
        "type": "n8n-nodes-base.splitInBatches",
        "position": [
          752,
          1024
        ],
        "disabled": false,
        "parameterKeys": [
          "options"
        ],
        "credentialTypes": []
      },
      {
        "name": "Build Task Row",
        "type": "n8n-nodes-base.code",
        "position": [
          976,
          1024
        ],
        "disabled": false,
        "parameterKeys": [
          "jsCode",
          "mode"
        ],
        "credentialTypes": []
      },
      {
        "name": "Create Task",
        "type": "n8n-nodes-base.supabase",
        "position": [
          976,
          1152
        ],
        "disabled": false,
        "parameterKeys": [
          "dataToSend",
          "tableId"
        ],
        "credentialTypes": [
          "Supabase credentials (not verified)"
        ]
      },
      {
        "name": "Task Is New?",
        "type": "n8n-nodes-base.if",
        "position": [
          1184,
          1152
        ],
        "disabled": false,
        "parameterKeys": [
          "conditions",
          "options"
        ],
        "credentialTypes": []
      },
      {
        "name": "Is Mock?",
        "type": "n8n-nodes-base.if",
        "position": [
          1408,
          1152
        ],
        "disabled": false,
        "parameterKeys": [
          "conditions",
          "options"
        ],
        "credentialTypes": []
      },
      {
        "name": "Mock Clip",
        "type": "n8n-nodes-base.code",
        "position": [
          1632,
          1056
        ],
        "disabled": false,
        "parameterKeys": [
          "jsCode",
          "mode"
        ],
        "credentialTypes": []
      },
      {
        "name": "Sign Scene Image",
        "type": "n8n-nodes-base.httpRequest",
        "position": [
          1632,
          1264
        ],
        "disabled": false,
        "parameterKeys": [
          "authentication",
          "headerParameters",
          "jsonBody",
          "method",
          "nodeCredentialType",
          "options",
          "sendBody",
          "sendHeaders",
          "specifyBody",
          "url"
        ],
        "credentialTypes": [
          "Supabase credentials (not verified)"
        ]
      },
      {
        "name": "Prep Provider Input",
        "type": "n8n-nodes-base.code",
        "position": [
          1856,
          1264
        ],
        "disabled": false,
        "parameterKeys": [
          "jsCode",
          "mode"
        ],
        "credentialTypes": []
      },
      {
        "name": "Apply Motion Prompt",
        "type": "n8n-nodes-base.code",
        "position": [
          3184,
          1824
        ],
        "disabled": false,
        "parameterKeys": [
          "jsCode",
          "mode"
        ],
        "credentialTypes": []
      },
      {
        "name": "Finalize Clip",
        "type": "n8n-nodes-base.code",
        "position": [
          3424,
          1056
        ],
        "disabled": false,
        "parameterKeys": [
          "jsCode",
          "mode"
        ],
        "credentialTypes": []
      },
      {
        "name": "Clip Outcome",
        "type": "n8n-nodes-base.switch",
        "position": [
          3648,
          1056
        ],
        "disabled": false,
        "parameterKeys": [
          "options",
          "rules"
        ],
        "credentialTypes": []
      },
      {
        "name": "Mark Task Failed",
        "type": "n8n-nodes-base.supabase",
        "position": [
          3872,
          848
        ],
        "disabled": false,
        "parameterKeys": [
          "fieldsUi",
          "filterString",
          "filterType",
          "operation",
          "tableId"
        ],
        "credentialTypes": [
          "Supabase credentials (not verified)"
        ]
      },
      {
        "name": "Download Clip",
        "type": "n8n-nodes-base.httpRequest",
        "position": [
          3872,
          1248
        ],
        "disabled": false,
        "parameterKeys": [
          "options",
          "url"
        ],
        "credentialTypes": []
      },
      {
        "name": "Upload Clip",
        "type": "n8n-nodes-base.httpRequest",
        "position": [
          4096,
          1248
        ],
        "disabled": false,
        "parameterKeys": [
          "authentication",
          "contentType",
          "headerParameters",
          "inputDataFieldName",
          "method",
          "nodeCredentialType",
          "options",
          "sendBody",
          "sendHeaders",
          "url"
        ],
        "credentialTypes": [
          "Supabase credentials (not verified)"
        ]
      },
      {
        "name": "Prepare Asset Row",
        "type": "n8n-nodes-base.code",
        "position": [
          4304,
          1152
        ],
        "disabled": false,
        "parameterKeys": [
          "jsCode",
          "mode"
        ],
        "credentialTypes": []
      },
      {
        "name": "Record Clip Asset",
        "type": "n8n-nodes-base.supabase",
        "position": [
          4528,
          1152
        ],
        "disabled": false,
        "parameterKeys": [
          "dataToSend",
          "tableId"
        ],
        "credentialTypes": [
          "Supabase credentials (not verified)"
        ]
      },
      {
        "name": "Complete Task",
        "type": "n8n-nodes-base.supabase",
        "position": [
          4752,
          1152
        ],
        "disabled": false,
        "parameterKeys": [
          "fieldsUi",
          "filterString",
          "filterType",
          "operation",
          "tableId"
        ],
        "credentialTypes": [
          "Supabase credentials (not verified)"
        ]
      },
      {
        "name": "Collapse To One",
        "type": "n8n-nodes-base.code",
        "position": [
          976,
          1536
        ],
        "disabled": false,
        "parameterKeys": [
          "jsCode"
        ],
        "credentialTypes": []
      },
      {
        "name": "Load Script",
        "type": "n8n-nodes-base.supabase",
        "position": [
          1184,
          1536
        ],
        "disabled": false,
        "parameterKeys": [
          "filterString",
          "filterType",
          "limit",
          "operation",
          "tableId"
        ],
        "credentialTypes": [
          "Supabase credentials (not verified)"
        ]
      },
      {
        "name": "Load Clip Assets",
        "type": "n8n-nodes-base.supabase",
        "position": [
          1408,
          1536
        ],
        "disabled": false,
        "parameterKeys": [
          "filterString",
          "filterType",
          "operation",
          "returnAll",
          "tableId"
        ],
        "credentialTypes": [
          "Supabase credentials (not verified)"
        ]
      },
      {
        "name": "Build Video Plan",
        "type": "n8n-nodes-base.code",
        "position": [
          1632,
          1536
        ],
        "disabled": false,
        "parameterKeys": [
          "jsCode"
        ],
        "credentialTypes": []
      },
      {
        "name": "Plan OK?",
        "type": "n8n-nodes-base.if",
        "position": [
          1856,
          1536
        ],
        "disabled": false,
        "parameterKeys": [
          "conditions",
          "options"
        ],
        "credentialTypes": []
      },
      {
        "name": "Load Latest Video Version",
        "type": "n8n-nodes-base.supabase",
        "position": [
          2064,
          1632
        ],
        "disabled": false,
        "parameterKeys": [
          "filterString",
          "filterType",
          "limit",
          "operation",
          "tableId"
        ],
        "credentialTypes": [
          "Supabase credentials (not verified)"
        ]
      },
      {
        "name": "Needs Voiceover?",
        "type": "n8n-nodes-base.if",
        "position": [
          2288,
          1632
        ],
        "disabled": false,
        "parameterKeys": [
          "conditions",
          "options"
        ],
        "credentialTypes": []
      },
      {
        "name": "TTS Voiceover",
        "type": "n8n-nodes-base.httpRequest",
        "position": [
          2448,
          1440
        ],
        "disabled": false,
        "parameterKeys": [
          "headerParameters",
          "jsonBody",
          "method",
          "options",
          "sendBody",
          "sendHeaders",
          "specifyBody",
          "url"
        ],
        "credentialTypes": []
      },
      {
        "name": "Upload Voiceover",
        "type": "n8n-nodes-base.httpRequest",
        "position": [
          2656,
          1376
        ],
        "disabled": false,
        "parameterKeys": [
          "authentication",
          "contentType",
          "headerParameters",
          "inputDataFieldName",
          "method",
          "nodeCredentialType",
          "options",
          "sendBody",
          "sendHeaders",
          "url"
        ],
        "credentialTypes": [
          "Supabase credentials (not verified)"
        ]
      },
      {
        "name": "Prepare Voiceover Row",
        "type": "n8n-nodes-base.code",
        "position": [
          2848,
          1632
        ],
        "disabled": false,
        "parameterKeys": [
          "jsCode"
        ],
        "credentialTypes": []
      },
      {
        "name": "Record Voiceover Asset",
        "type": "n8n-nodes-base.supabase",
        "position": [
          2944,
          1536
        ],
        "disabled": false,
        "parameterKeys": [
          "dataToSend",
          "tableId"
        ],
        "credentialTypes": [
          "Supabase credentials (not verified)"
        ]
      },
      {
        "name": "Prepare Video Row",
        "type": "n8n-nodes-base.code",
        "position": [
          3168,
          1632
        ],
        "disabled": false,
        "parameterKeys": [
          "jsCode"
        ],
        "credentialTypes": []
      },
      {
        "name": "Create Video Record",
        "type": "n8n-nodes-base.supabase",
        "position": [
          3392,
          1632
        ],
        "disabled": false,
        "parameterKeys": [
          "dataToSend",
          "tableId"
        ],
        "credentialTypes": [
          "Supabase credentials (not verified)"
        ]
      },
      {
        "name": "Supersede Old Approvals",
        "type": "n8n-nodes-base.supabase",
        "position": [
          3616,
          1632
        ],
        "disabled": false,
        "parameterKeys": [
          "fieldsUi",
          "filterString",
          "filterType",
          "operation",
          "tableId"
        ],
        "credentialTypes": [
          "Supabase credentials (not verified)"
        ]
      },
      {
        "name": "Create Approval",
        "type": "n8n-nodes-base.supabase",
        "position": [
          3824,
          1632
        ],
        "disabled": false,
        "parameterKeys": [
          "fieldsUi",
          "tableId"
        ],
        "credentialTypes": [
          "Supabase credentials (not verified)"
        ]
      },
      {
        "name": "Update Project Awaiting Approval",
        "type": "n8n-nodes-base.supabase",
        "position": [
          4048,
          1632
        ],
        "disabled": false,
        "parameterKeys": [
          "fieldsUi",
          "filterString",
          "filterType",
          "operation",
          "tableId"
        ],
        "credentialTypes": [
          "Supabase credentials (not verified)"
        ]
      },
      {
        "name": "Build Event Row",
        "type": "n8n-nodes-base.code",
        "position": [
          4384,
          1728
        ],
        "disabled": false,
        "parameterKeys": [
          "jsCode"
        ],
        "credentialTypes": []
      },
      {
        "name": "Log Event",
        "type": "n8n-nodes-base.supabase",
        "position": [
          4496,
          1632
        ],
        "disabled": false,
        "parameterKeys": [
          "dataToSend",
          "tableId"
        ],
        "credentialTypes": [
          "Supabase credentials (not verified)"
        ]
      },
      {
        "name": "Return Result",
        "type": "n8n-nodes-base.code",
        "position": [
          4704,
          1632
        ],
        "disabled": false,
        "parameterKeys": [
          "jsCode"
        ],
        "credentialTypes": []
      },
      {
        "name": "Reply Ready",
        "type": "n8n-nodes-base.telegram",
        "position": [
          4928,
          1632
        ],
        "disabled": false,
        "parameterKeys": [
          "additionalFields",
          "chatId",
          "inlineKeyboard",
          "replyMarkup",
          "text"
        ],
        "credentialTypes": [
          "Telegram credentials (not verified)"
        ]
      },
      {
        "name": "Fetch Scene Image",
        "type": "n8n-nodes-base.httpRequest",
        "position": [
          2064,
          1824
        ],
        "disabled": false,
        "parameterKeys": [
          "options",
          "url"
        ],
        "credentialTypes": []
      },
      {
        "name": "Encode Scene Image",
        "type": "n8n-nodes-base.code",
        "position": [
          2288,
          1824
        ],
        "disabled": false,
        "parameterKeys": [
          "jsCode"
        ],
        "credentialTypes": []
      },
      {
        "name": "Free.ai Video Generation (CogVideoX)",
        "type": "n8n-nodes-base.httpRequest",
        "position": [
          3408,
          1824
        ],
        "disabled": false,
        "parameterKeys": [
          "headerParameters",
          "jsonBody",
          "method",
          "options",
          "sendBody",
          "sendHeaders",
          "specifyBody",
          "url"
        ],
        "credentialTypes": []
      },
      {
        "name": "Free.ai Video Result",
        "type": "n8n-nodes-base.code",
        "position": [
          4528,
          1824
        ],
        "disabled": false,
        "parameterKeys": [
          "jsCode",
          "mode"
        ],
        "credentialTypes": []
      },
      {
        "name": "Fetch Free.ai Generated Image",
        "type": "n8n-nodes-base.httpRequest",
        "position": [
          672,
          352
        ],
        "disabled": false,
        "parameterKeys": [
          "options",
          "url"
        ],
        "credentialTypes": []
      },
      {
        "name": "Reply Unauthorized",
        "type": "n8n-nodes-base.telegram",
        "position": [
          -2048,
          432
        ],
        "disabled": false,
        "parameterKeys": [
          "additionalFields",
          "chatId",
          "text"
        ],
        "credentialTypes": [
          "Telegram credentials (not verified)"
        ]
      }
    ],
    "edges": [
      {
        "from": "Config",
        "to": "Authorized?",
        "type": "main",
        "outputIndex": 0,
        "label": "Output 1"
      },
      {
        "from": "Telegram Trigger",
        "to": "Dedupe Update",
        "type": "main",
        "outputIndex": 0,
        "label": "Output 1"
      },
      {
        "from": "Dedupe Update",
        "to": "Normalize Telegram Input",
        "type": "main",
        "outputIndex": 0,
        "label": "Output 1"
      },
      {
        "from": "Normalize Telegram Input",
        "to": "Config",
        "type": "main",
        "outputIndex": 0,
        "label": "Output 1"
      },
      {
        "from": "Supported Input?",
        "to": "Is Callback?",
        "type": "main",
        "outputIndex": 0,
        "label": "True"
      },
      {
        "from": "Supported Input?",
        "to": "Reply Unsupported",
        "type": "main",
        "outputIndex": 1,
        "label": "False"
      },
      {
        "from": "Authorized?",
        "to": "Supported Input?",
        "type": "main",
        "outputIndex": 0,
        "label": "True"
      },
      {
        "from": "Authorized?",
        "to": "Setup Needed?",
        "type": "main",
        "outputIndex": 1,
        "label": "False"
      },
      {
        "from": "Setup Needed?",
        "to": "Reply Setup Needed",
        "type": "main",
        "outputIndex": 0,
        "label": "True"
      },
      {
        "from": "Setup Needed?",
        "to": "Reply Unauthorized",
        "type": "main",
        "outputIndex": 1,
        "label": "False"
      },
      {
        "from": "Is Callback?",
        "to": "Answer Callback",
        "type": "main",
        "outputIndex": 0,
        "label": "True"
      },
      {
        "from": "Is Callback?",
        "to": "Has Voice?",
        "type": "main",
        "outputIndex": 1,
        "label": "False"
      },
      {
        "from": "Answer Callback",
        "to": "Parse Callback",
        "type": "main",
        "outputIndex": 0,
        "label": "Output 1"
      },
      {
        "from": "Parse Callback",
        "to": "Load Approval",
        "type": "main",
        "outputIndex": 0,
        "label": "Output 1"
      },
      {
        "from": "Load Approval",
        "to": "Load Approval Project",
        "type": "main",
        "outputIndex": 0,
        "label": "Output 1"
      },
      {
        "from": "Load Approval Project",
        "to": "Validate Callback",
        "type": "main",
        "outputIndex": 0,
        "label": "Output 1"
      },
      {
        "from": "Validate Callback",
        "to": "Callback Valid?",
        "type": "main",
        "outputIndex": 0,
        "label": "Output 1"
      },
      {
        "from": "Callback Valid?",
        "to": "Decision Plan",
        "type": "main",
        "outputIndex": 0,
        "label": "True"
      },
      {
        "from": "Callback Valid?",
        "to": "Reply Stale",
        "type": "main",
        "outputIndex": 1,
        "label": "False"
      },
      {
        "from": "Decision Plan",
        "to": "Update Approval",
        "type": "main",
        "outputIndex": 0,
        "label": "Output 1"
      },
      {
        "from": "Update Approval",
        "to": "Update Project Status",
        "type": "main",
        "outputIndex": 0,
        "label": "Output 1"
      },
      {
        "from": "Update Project Status",
        "to": "Reply Decision",
        "type": "main",
        "outputIndex": 0,
        "label": "Output 1"
      },
      {
        "from": "Reply Decision",
        "to": "Scenes Approved?",
        "type": "main",
        "outputIndex": 0,
        "label": "Output 1"
      },
      {
        "from": "Scenes Approved?",
        "to": "Approve Scenes",
        "type": "main",
        "outputIndex": 0,
        "label": "True"
      },
      {
        "from": "Scenes Approved?",
        "to": "Video Approved?",
        "type": "main",
        "outputIndex": 1,
        "label": "False"
      },
      {
        "from": "Approve Scenes",
        "to": "Resume Context",
        "type": "main",
        "outputIndex": 0,
        "label": "Output 1"
      },
      {
        "from": "Resume Context",
        "to": "Claim Project",
        "type": "main",
        "outputIndex": 0,
        "label": "Output 1"
      },
      {
        "from": "Video Approved?",
        "to": "Approve Video",
        "type": "main",
        "outputIndex": 0,
        "label": "True"
      },
      {
        "from": "Has Voice?",
        "to": "Get Voice File",
        "type": "main",
        "outputIndex": 0,
        "label": "True"
      },
      {
        "from": "Has Voice?",
        "to": "Create Project",
        "type": "main",
        "outputIndex": 1,
        "label": "False"
      },
      {
        "from": "Get Voice File",
        "to": "Encode Voice",
        "type": "main",
        "outputIndex": 0,
        "label": "Output 1"
      },
      {
        "from": "Encode Voice",
        "to": "Transcribe Voice",
        "type": "main",
        "outputIndex": 0,
        "label": "Output 1"
      },
      {
        "from": "Transcribe Voice",
        "to": "Merge Transcript",
        "type": "main",
        "outputIndex": 0,
        "label": "Output 1"
      },
      {
        "from": "Merge Transcript",
        "to": "Transcript OK?",
        "type": "main",
        "outputIndex": 0,
        "label": "Output 1"
      },
      {
        "from": "Transcript OK?",
        "to": "Create Project",
        "type": "main",
        "outputIndex": 0,
        "label": "True"
      },
      {
        "from": "Transcript OK?",
        "to": "Reply Voice Failed",
        "type": "main",
        "outputIndex": 1,
        "label": "False"
      },
      {
        "from": "Create Project",
        "to": "Intake",
        "type": "main",
        "outputIndex": 0,
        "label": "Output 1"
      },
      {
        "from": "Intake",
        "to": "Set Planning",
        "type": "main",
        "outputIndex": 0,
        "label": "Output 1"
      },
      {
        "from": "Set Planning",
        "to": "Has Link?",
        "type": "main",
        "outputIndex": 0,
        "label": "Output 1"
      },
      {
        "from": "Has Link?",
        "to": "Fetch Link",
        "type": "main",
        "outputIndex": 0,
        "label": "True"
      },
      {
        "from": "Has Link?",
        "to": "Has Image?",
        "type": "main",
        "outputIndex": 1,
        "label": "False"
      },
      {
        "from": "Has Image?",
        "to": "Fetch Source Image",
        "type": "main",
        "outputIndex": 0,
        "label": "True"
      },
      {
        "from": "Has Image?",
        "to": "Build Source Package",
        "type": "main",
        "outputIndex": 1,
        "label": "False"
      },
      {
        "from": "Fetch Link",
        "to": "Has Image?",
        "type": "main",
        "outputIndex": 0,
        "label": "Output 1"
      },
      {
        "from": "Fetch Source Image",
        "to": "Build Source Package",
        "type": "main",
        "outputIndex": 0,
        "label": "Output 1"
      },
      {
        "from": "Build Source Package",
        "to": "Source Usable?",
        "type": "main",
        "outputIndex": 0,
        "label": "Output 1"
      },
      {
        "from": "Source Usable?",
        "to": "Gemini Analyst",
        "type": "main",
        "outputIndex": 0,
        "label": "True"
      },
      {
        "from": "Source Usable?",
        "to": "Reply Source Needed",
        "type": "main",
        "outputIndex": 1,
        "label": "False"
      },
      {
        "from": "Gemini Analyst",
        "to": "Build Story Prompt",
        "type": "main",
        "outputIndex": 0,
        "label": "Output 1"
      },
      {
        "from": "Gemini Analyst",
        "to": "Build Pipeline Error",
        "type": "main",
        "outputIndex": 1,
        "label": "Output 2"
      },
      {
        "from": "Gemini Analyst Model",
        "to": "Gemini Analyst",
        "type": "ai_languageModel",
        "outputIndex": 0,
        "label": "Output 1"
      },
      {
        "from": "Build Story Prompt",
        "to": "Gemini Story Agent",
        "type": "main",
        "outputIndex": 0,
        "label": "Output 1"
      },
      {
        "from": "Build Story Prompt",
        "to": "Build Pipeline Error",
        "type": "main",
        "outputIndex": 1,
        "label": "Output 2"
      },
      {
        "from": "Gemini Story Agent",
        "to": "Parse Scene Plan",
        "type": "main",
        "outputIndex": 0,
        "label": "Output 1"
      },
      {
        "from": "Gemini Story Agent",
        "to": "Build Pipeline Error",
        "type": "main",
        "outputIndex": 1,
        "label": "Output 2"
      },
      {
        "from": "Google Gemini Chat Model",
        "to": "Gemini Story Agent",
        "type": "ai_languageModel",
        "outputIndex": 0,
        "label": "Output 1"
      },
      {
        "from": "Parse Scene Plan",
        "to": "Image Gen Enabled?",
        "type": "main",
        "outputIndex": 0,
        "label": "Output 1"
      },
      {
        "from": "Parse Scene Plan",
        "to": "Build Pipeline Error",
        "type": "main",
        "outputIndex": 1,
        "label": "Output 2"
      },
      {
        "from": "Image Gen Enabled?",
        "to": "Free.ai Image Generation (SDXL)",
        "type": "main",
        "outputIndex": 0,
        "label": "True"
      },
      {
        "from": "Image Gen Enabled?",
        "to": "Prepare Storyboard Rows",
        "type": "main",
        "outputIndex": 1,
        "label": "False"
      },
      {
        "from": "Upload Scene Image",
        "to": "Prepare Scene Asset Rows",
        "type": "main",
        "outputIndex": 0,
        "label": "Output 1"
      },
      {
        "from": "Prepare Scene Asset Rows",
        "to": "Record Scene Assets",
        "type": "main",
        "outputIndex": 0,
        "label": "Output 1"
      },
      {
        "from": "Record Scene Assets",
        "to": "Prepare Scene Rows",
        "type": "main",
        "outputIndex": 0,
        "label": "Output 1"
      },
      {
        "from": "Prepare Scene Rows",
        "to": "Create Scenes",
        "type": "main",
        "outputIndex": 0,
        "label": "Output 1"
      },
      {
        "from": "Prepare Storyboard Rows",
        "to": "Create Scenes",
        "type": "main",
        "outputIndex": 0,
        "label": "Output 1"
      },
      {
        "from": "Create Scenes",
        "to": "Create Scene Approval",
        "type": "main",
        "outputIndex": 0,
        "label": "Output 1"
      },
      {
        "from": "Create Scene Approval",
        "to": "Set Awaiting Scene Approval",
        "type": "main",
        "outputIndex": 0,
        "label": "Output 1"
      },
      {
        "from": "Set Awaiting Scene Approval",
        "to": "Reply Scene Approval",
        "type": "main",
        "outputIndex": 0,
        "label": "Output 1"
      },
      {
        "from": "Build Pipeline Error",
        "to": "Reply Pipeline Error",
        "type": "main",
        "outputIndex": 0,
        "label": "Output 1"
      },
      {
        "from": "Reply Pipeline Error",
        "to": "Log Error Event",
        "type": "main",
        "outputIndex": 0,
        "label": "Output 1"
      },
      {
        "from": "Log Error Event",
        "to": "Mark Project Failed",
        "type": "main",
        "outputIndex": 0,
        "label": "Output 1"
      },
      {
        "from": "Gemini Video Agent Model",
        "to": "Video Agent",
        "type": "ai_languageModel",
        "outputIndex": 0,
        "label": "Output 1"
      },
      {
        "from": "Video Agent",
        "to": "Apply Motion Prompt",
        "type": "main",
        "outputIndex": 0,
        "label": "Output 1"
      },
      {
        "from": "Claim Project",
        "to": "Claimed?",
        "type": "main",
        "outputIndex": 0,
        "label": "Output 1"
      },
      {
        "from": "Claimed?",
        "to": "Reset Failed Tasks",
        "type": "main",
        "outputIndex": 0,
        "label": "True"
      },
      {
        "from": "Claimed?",
        "to": "Reply Not Eligible",
        "type": "main",
        "outputIndex": 1,
        "label": "False"
      },
      {
        "from": "Reset Failed Tasks",
        "to": "Load Settings",
        "type": "main",
        "outputIndex": 0,
        "label": "Output 1"
      },
      {
        "from": "Load Settings",
        "to": "Load Approved Scenes",
        "type": "main",
        "outputIndex": 0,
        "label": "Output 1"
      },
      {
        "from": "Load Approved Scenes",
        "to": "Load Scene Assets",
        "type": "main",
        "outputIndex": 0,
        "label": "Output 1"
      },
      {
        "from": "Load Scene Assets",
        "to": "Build Job",
        "type": "main",
        "outputIndex": 0,
        "label": "Output 1"
      },
      {
        "from": "Build Job",
        "to": "Job OK?",
        "type": "main",
        "outputIndex": 0,
        "label": "Output 1"
      },
      {
        "from": "Job OK?",
        "to": "Split Scenes",
        "type": "main",
        "outputIndex": 0,
        "label": "True"
      },
      {
        "from": "Job OK?",
        "to": "Failure Info",
        "type": "main",
        "outputIndex": 1,
        "label": "False"
      },
      {
        "from": "Failure Info",
        "to": "Fail Project",
        "type": "main",
        "outputIndex": 0,
        "label": "Output 1"
      },
      {
        "from": "Fail Project",
        "to": "Reply Failure",
        "type": "main",
        "outputIndex": 0,
        "label": "Output 1"
      },
      {
        "from": "Split Scenes",
        "to": "Loop Over Scenes",
        "type": "main",
        "outputIndex": 0,
        "label": "Output 1"
      },
      {
        "from": "Loop Over Scenes",
        "to": "Collapse To One",
        "type": "main",
        "outputIndex": 0,
        "label": "Output 1"
      },
      {
        "from": "Loop Over Scenes",
        "to": "Build Task Row",
        "type": "main",
        "outputIndex": 1,
        "label": "Output 2"
      },
      {
        "from": "Build Task Row",
        "to": "Create Task",
        "type": "main",
        "outputIndex": 0,
        "label": "Output 1"
      },
      {
        "from": "Create Task",
        "to": "Task Is New?",
        "type": "main",
        "outputIndex": 0,
        "label": "Output 1"
      },
      {
        "from": "Task Is New?",
        "to": "Is Mock?",
        "type": "main",
        "outputIndex": 0,
        "label": "True"
      },
      {
        "from": "Task Is New?",
        "to": "Loop Over Scenes",
        "type": "main",
        "outputIndex": 1,
        "label": "False"
      },
      {
        "from": "Is Mock?",
        "to": "Mock Clip",
        "type": "main",
        "outputIndex": 0,
        "label": "True"
      },
      {
        "from": "Is Mock?",
        "to": "Sign Scene Image",
        "type": "main",
        "outputIndex": 1,
        "label": "False"
      },
      {
        "from": "Mock Clip",
        "to": "Finalize Clip",
        "type": "main",
        "outputIndex": 0,
        "label": "Output 1"
      },
      {
        "from": "Sign Scene Image",
        "to": "Prep Provider Input",
        "type": "main",
        "outputIndex": 0,
        "label": "Output 1"
      },
      {
        "from": "Prep Provider Input",
        "to": "Fetch Scene Image",
        "type": "main",
        "outputIndex": 0,
        "label": "Output 1"
      },
      {
        "from": "Apply Motion Prompt",
        "to": "Free.ai Video Generation (CogVideoX)",
        "type": "main",
        "outputIndex": 0,
        "label": "Output 1"
      },
      {
        "from": "Finalize Clip",
        "to": "Clip Outcome",
        "type": "main",
        "outputIndex": 0,
        "label": "Output 1"
      },
      {
        "from": "Clip Outcome",
        "to": "Mark Task Failed",
        "type": "main",
        "outputIndex": 0,
        "label": "Output 1"
      },
      {
        "from": "Clip Outcome",
        "to": "Prepare Asset Row",
        "type": "main",
        "outputIndex": 1,
        "label": "Output 2"
      },
      {
        "from": "Clip Outcome",
        "to": "Download Clip",
        "type": "main",
        "outputIndex": 2,
        "label": "Output 3"
      },
      {
        "from": "Mark Task Failed",
        "to": "Loop Over Scenes",
        "type": "main",
        "outputIndex": 0,
        "label": "Output 1"
      },
      {
        "from": "Download Clip",
        "to": "Upload Clip",
        "type": "main",
        "outputIndex": 0,
        "label": "Output 1"
      },
      {
        "from": "Upload Clip",
        "to": "Prepare Asset Row",
        "type": "main",
        "outputIndex": 0,
        "label": "Output 1"
      },
      {
        "from": "Prepare Asset Row",
        "to": "Record Clip Asset",
        "type": "main",
        "outputIndex": 0,
        "label": "Output 1"
      },
      {
        "from": "Record Clip Asset",
        "to": "Complete Task",
        "type": "main",
        "outputIndex": 0,
        "label": "Output 1"
      },
      {
        "from": "Complete Task",
        "to": "Loop Over Scenes",
        "type": "main",
        "outputIndex": 0,
        "label": "Output 1"
      },
      {
        "from": "Collapse To One",
        "to": "Load Script",
        "type": "main",
        "outputIndex": 0,
        "label": "Output 1"
      },
      {
        "from": "Load Script",
        "to": "Load Clip Assets",
        "type": "main",
        "outputIndex": 0,
        "label": "Output 1"
      },
      {
        "from": "Load Clip Assets",
        "to": "Build Video Plan",
        "type": "main",
        "outputIndex": 0,
        "label": "Output 1"
      },
      {
        "from": "Build Video Plan",
        "to": "Plan OK?",
        "type": "main",
        "outputIndex": 0,
        "label": "Output 1"
      },
      {
        "from": "Plan OK?",
        "to": "Load Latest Video Version",
        "type": "main",
        "outputIndex": 0,
        "label": "True"
      },
      {
        "from": "Plan OK?",
        "to": "Failure Info",
        "type": "main",
        "outputIndex": 1,
        "label": "False"
      },
      {
        "from": "Load Latest Video Version",
        "to": "Needs Voiceover?",
        "type": "main",
        "outputIndex": 0,
        "label": "Output 1"
      },
      {
        "from": "Needs Voiceover?",
        "to": "TTS Voiceover",
        "type": "main",
        "outputIndex": 0,
        "label": "True"
      },
      {
        "from": "Needs Voiceover?",
        "to": "Prepare Video Row",
        "type": "main",
        "outputIndex": 1,
        "label": "False"
      },
      {
        "from": "TTS Voiceover",
        "to": "Upload Voiceover",
        "type": "main",
        "outputIndex": 0,
        "label": "Output 1"
      },
      {
        "from": "Upload Voiceover",
        "to": "Prepare Voiceover Row",
        "type": "main",
        "outputIndex": 0,
        "label": "Output 1"
      },
      {
        "from": "Prepare Voiceover Row",
        "to": "Record Voiceover Asset",
        "type": "main",
        "outputIndex": 0,
        "label": "Output 1"
      },
      {
        "from": "Record Voiceover Asset",
        "to": "Prepare Video Row",
        "type": "main",
        "outputIndex": 0,
        "label": "Output 1"
      },
      {
        "from": "Prepare Video Row",
        "to": "Create Video Record",
        "type": "main",
        "outputIndex": 0,
        "label": "Output 1"
      },
      {
        "from": "Create Video Record",
        "to": "Supersede Old Approvals",
        "type": "main",
        "outputIndex": 0,
        "label": "Output 1"
      },
      {
        "from": "Supersede Old Approvals",
        "to": "Create Approval",
        "type": "main",
        "outputIndex": 0,
        "label": "Output 1"
      },
      {
        "from": "Create Approval",
        "to": "Update Project Awaiting Approval",
        "type": "main",
        "outputIndex": 0,
        "label": "Output 1"
      },
      {
        "from": "Update Project Awaiting Approval",
        "to": "Build Event Row",
        "type": "main",
        "outputIndex": 0,
        "label": "Output 1"
      },
      {
        "from": "Build Event Row",
        "to": "Log Event",
        "type": "main",
        "outputIndex": 0,
        "label": "Output 1"
      },
      {
        "from": "Log Event",
        "to": "Return Result",
        "type": "main",
        "outputIndex": 0,
        "label": "Output 1"
      },
      {
        "from": "Return Result",
        "to": "Reply Ready",
        "type": "main",
        "outputIndex": 0,
        "label": "Output 1"
      },
      {
        "from": "Fetch Scene Image",
        "to": "Encode Scene Image",
        "type": "main",
        "outputIndex": 0,
        "label": "Output 1"
      },
      {
        "from": "Encode Scene Image",
        "to": "Video Agent",
        "type": "main",
        "outputIndex": 0,
        "label": "Output 1"
      },
      {
        "from": "Free.ai Image Generation (SDXL)",
        "to": "Fetch Free.ai Generated Image",
        "type": "main",
        "outputIndex": 0,
        "label": "Output 1"
      },
      {
        "from": "Free.ai Image Generation (SDXL)",
        "to": "Build Pipeline Error",
        "type": "main",
        "outputIndex": 1,
        "label": "Output 2"
      },
      {
        "from": "Fetch Free.ai Generated Image",
        "to": "Upload Scene Image",
        "type": "main",
        "outputIndex": 0,
        "label": "Output 1"
      },
      {
        "from": "Fetch Free.ai Generated Image",
        "to": "Send Scene Photo",
        "type": "main",
        "outputIndex": 0,
        "label": "Output 1"
      },
      {
        "from": "Free.ai Video Generation (CogVideoX)",
        "to": "Free.ai Video Result",
        "type": "main",
        "outputIndex": 0,
        "label": "Output 1"
      },
      {
        "from": "Free.ai Video Result",
        "to": "Finalize Clip",
        "type": "main",
        "outputIndex": 0,
        "label": "Output 1"
      }
    ]
  },
  "watchdog": {
    "name": "Workflow Watchdog (AI Error Alerts)",
    "activeInExport": false,
    "configuration": {},
    "nodes": [
      {
        "name": "Workflow Failed",
        "type": "n8n-nodes-base.errorTrigger",
        "position": [
          240,
          288
        ],
        "disabled": false,
        "parameterKeys": [],
        "credentialTypes": []
      },
      {
        "name": "Normalize Error",
        "type": "n8n-nodes-base.set",
        "position": [
          496,
          416
        ],
        "disabled": false,
        "parameterKeys": [
          "assignments",
          "options"
        ],
        "credentialTypes": []
      },
      {
        "name": "Explain Error With AI",
        "type": "@n8n/n8n-nodes-langchain.googleGemini",
        "position": [
          736,
          416
        ],
        "disabled": false,
        "parameterKeys": [
          "builtInTools",
          "jsonOutput",
          "messages",
          "modelId",
          "options"
        ],
        "credentialTypes": [
          "Google Gemini credentials (not verified)"
        ]
      },
      {
        "name": "Build Alert Message",
        "type": "n8n-nodes-base.code",
        "position": [
          976,
          416
        ],
        "disabled": false,
        "parameterKeys": [
          "jsCode"
        ],
        "credentialTypes": []
      },
      {
        "name": "Send Telegram Alert",
        "type": "n8n-nodes-base.telegram",
        "position": [
          992,
          288
        ],
        "disabled": false,
        "parameterKeys": [
          "additionalFields",
          "chatId",
          "text"
        ],
        "credentialTypes": [
          "Telegram credentials (not verified)"
        ]
      }
    ],
    "edges": [
      {
        "from": "Workflow Failed",
        "to": "Normalize Error",
        "type": "main",
        "outputIndex": 0,
        "label": "Output 1"
      },
      {
        "from": "Normalize Error",
        "to": "Explain Error With AI",
        "type": "main",
        "outputIndex": 0,
        "label": "Output 1"
      },
      {
        "from": "Explain Error With AI",
        "to": "Build Alert Message",
        "type": "main",
        "outputIndex": 0,
        "label": "Output 1"
      },
      {
        "from": "Build Alert Message",
        "to": "Send Telegram Alert",
        "type": "main",
        "outputIndex": 0,
        "label": "Output 1"
      }
    ]
  }
};
