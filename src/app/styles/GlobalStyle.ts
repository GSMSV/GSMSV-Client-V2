import { createGlobalStyle } from 'styled-components';

export const GlobalStyle = createGlobalStyle`
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
