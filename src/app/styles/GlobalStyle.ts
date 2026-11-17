import { createGlobalStyle } from 'styled-components';

export const GlobalStyle = createGlobalStyle`
  @font-face {
    font-family: 'Pretendard';
    src: url('/assets/PretendardVariable.woff2') format('woff2');
    font-style: normal;
    font-weight: 100 900;
    font-display: swap;
  }

  *,
  *::before,
  *::after {
    box-sizing: border-box;
  }

  html {
    color-scheme: dark;
    background: ${({ theme }) => theme.colors.canvas};
  }

  body {
    margin: 0;
    background: ${({ theme }) => theme.colors.canvas};
    color: ${({ theme }) => theme.colors.text};
    font-family: ${({ theme }) => theme.typography.body.family}, sans-serif;
    font-size: ${({ theme }) => theme.typography.body.size}px;
    font-weight: ${({ theme }) => theme.typography.body.weight};
    line-height: ${({ theme }) => theme.typography.body.lineHeight}px;
    letter-spacing: ${({ theme }) => theme.typography.body.letterSpacing}px;
    -webkit-font-smoothing: antialiased;
    text-rendering: optimizeLegibility;
  }

  button,
  input,
  select,
  textarea {
    font: inherit;
  }

  button {
    color: inherit;
  }

  a {
    color: inherit;
  }
`;
