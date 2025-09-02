// Simplified frame utilities to replace OnchainKit dependencies

export interface FrameRequest {
  untrustedData: {
    fid: number;
    url: string;
    messageHash: string;
    timestamp: number;
    network: number;
    buttonIndex: number;
    inputText?: string;
    castId?: {
      fid: number;
      hash: string;
    };
  };
  trustedData: {
    messageBytes: string;
  };
}

export interface FrameMessage {
  fid: number;
  buttonIndex: number;
  inputText?: string;
  castId: {
    fid: number;
    hash: string;
  } | null;
  url?: string;
  timestamp?: Date;
  interactor?: {
    verified_accounts: string[];
  };
  input?: string;
  button?: number;
}

export async function getFrameMessage(body: any, options?: any): Promise<{ isValid: boolean; message: FrameMessage }> {
  // Simplified frame message parsing
  const message: FrameMessage = {
    fid: body?.untrustedData?.fid || 0,
    buttonIndex: body?.untrustedData?.buttonIndex || 1,
    inputText: body?.untrustedData?.inputText || '',
    castId: body?.untrustedData?.castId || null,
    url: body?.untrustedData?.url || '',
    timestamp: new Date(),
    interactor: {
      verified_accounts: ['0x' + (body?.untrustedData?.fid || 0).toString(16)]
    },
    input: body?.untrustedData?.inputText || '',
    button: body?.untrustedData?.buttonIndex || 1,
  };

  return {
    isValid: true,
    message,
  };
}

export function getFrameHtmlResponse({
  buttons,
  image,
  postUrl,
  refresh,
  input
}: {
  buttons?: Array<{ label: string; action?: string; target?: string }>;
  image: string | { src: string; aspectRatio?: string };
  postUrl?: string;
  refresh?: boolean;
  input?: { text: string };
}): string {
  const imageUrl = typeof image === 'string' ? image : image.src;
  const buttonTags = buttons?.map((button, index) => 
    `<meta name="fc:frame:button:${index + 1}" content="${button.label}" />`
  ).join('\n') || '';

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta property="fc:frame" content="vNext" />
        <meta property="fc:frame:image" content="${imageUrl}" />
        ${postUrl ? `<meta property="fc:frame:post_url" content="${postUrl}" />` : ''}
        ${input ? `<meta property="fc:frame:input:text" content="${input.text}" />` : ''}
        ${buttonTags}
        ${refresh ? '<meta property="fc:frame:refresh_period" content="0" />' : ''}
      </head>
      <body>
        <p>Farcaster Frame</p>
      </body>
    </html>
  `;

  return html;
}