package domain

// OpenAI API 请求结构体
type OpenAICompletionsRequest struct {
	Model            string                `json:"model" validate:"required"`
	Messages         []OpenAIMessage       `json:"messages" validate:"required"`
	Stream           bool                  `json:"stream,omitempty"`
	Temperature      *float64              `json:"temperature,omitempty"`
	MaxTokens        *int                  `json:"max_tokens,omitempty"`
	TopP             *float64              `json:"top_p,omitempty"`
	FrequencyPenalty *float64              `json:"frequency_penalty,omitempty"`
	PresencePenalty  *float64              `json:"presence_penalty,omitempty"`
	Stop             []string              `json:"stop,omitempty"`
	User             string                `json:"user,omitempty"`
	Tools            []OpenAITool          `json:"tools,omitempty"`
	ToolChoice       *OpenAIToolChoice     `json:"tool_choice,omitempty"`
	ResponseFormat   *OpenAIResponseFormat `json:"response_format,omitempty"`
}

type OpenAIMessage struct {
	Role       string           `json:"role" validate:"required"`
	Content    string           `json:"content,omitempty"`
	Name       string           `json:"name,omitempty"`
	ToolCalls  []OpenAIToolCall `json:"tool_calls,omitempty"`
	ToolCallID string           `json:"tool_call_id,omitempty"`
}

type OpenAITool struct {
	Type     string          `json:"type" validate:"required"`
	Function *OpenAIFunction `json:"function,omitempty"`
}

type OpenAIFunction struct {
	Name        string                 `json:"name" validate:"required"`
	Description string                 `json:"description,omitempty"`
	Parameters  map[string]interface{} `json:"parameters,omitempty"`
}

type OpenAIToolCall struct {
	ID       string             `json:"id" validate:"required"`
	Type     string             `json:"type" validate:"required"`
	Function OpenAIFunctionCall `json:"function" validate:"required"`
}

type OpenAIFunctionCall struct {
	Name      string `json:"name" validate:"required"`
	Arguments string `json:"arguments" validate:"required"`
}

type OpenAIToolChoice struct {
	Type     string                `json:"type,omitempty"`
	Function *OpenAIFunctionChoice `json:"function,omitempty"`
}

type OpenAIFunctionChoice struct {
	Name string `json:"name" validate:"required"`
}

type OpenAIResponseFormat struct {
	Type string `json:"type" validate:"required"`
}

// OpenAI API 响应结构体
type OpenAICompletionsResponse struct {
	ID      string         `json:"id"`
	Object  string         `json:"object"`
	Created int64          `json:"created"`
	Model   string         `json:"model"`
	Choices []OpenAIChoice `json:"choices"`
	Usage   *OpenAIUsage   `json:"usage,omitempty"`
}

type OpenAIChoice struct {
	Index        int            `json:"index"`
	Message      OpenAIMessage  `json:"message"`
	FinishReason string         `json:"finish_reason"`
	Delta        *OpenAIMessage `json:"delta,omitempty"` // for streaming
}

type OpenAIUsage struct {
	PromptTokens     int `json:"prompt_tokens"`
	CompletionTokens int `json:"completion_tokens"`
	TotalTokens      int `json:"total_tokens"`
}

// OpenAI 流式响应结构体
type OpenAIStreamResponse struct {
	ID      string               `json:"id"`
	Object  string               `json:"object"`
	Created int64                `json:"created"`
	Model   string               `json:"model"`
	Choices []OpenAIStreamChoice `json:"choices"`
}

type OpenAIStreamChoice struct {
	Index        int           `json:"index"`
	Delta        OpenAIMessage `json:"delta"`
	FinishReason *string       `json:"finish_reason,omitempty"`
}

// OpenAI 错误响应结构体
type OpenAIErrorResponse struct {
	Error OpenAIError `json:"error"`
}

type OpenAIError struct {
	Message string `json:"message"`
	Type    string `json:"type"`
	Code    string `json:"code,omitempty"`
	Param   string `json:"param,omitempty"`
}
