declare module "mammoth" {
  export interface Result<T = string> {
    value: T;
    messages: Array<{
      type: string;
      message: string;
    }>;
  }

  export interface ExtractRawTextInput {
    path?: string;
    buffer?: Buffer;
    arrayBuffer?: ArrayBuffer;
  }

  export function extractRawText(input: ExtractRawTextInput): Promise<Result<string>>;
  export function convertToHtml(input: ExtractRawTextInput, options?: Record<string, unknown>): Promise<Result<string>>;
  export function convertToMarkdown(input: ExtractRawTextInput, options?: Record<string, unknown>): Promise<Result<string>>;
}
