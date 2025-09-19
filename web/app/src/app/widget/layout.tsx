import StoreProvider from '@/provider';
import { darkThemeWidget, lightThemeWidget } from '@/theme';
import { getShareV1AppWidgetInfo } from '@/request/ShareApp';
import { ThemeProvider } from '@ctzhian/ui';

import React from 'react';

const Layout = async ({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) => {
  const widgetDetail: any = await getShareV1AppWidgetInfo();

  const themeMode =
    widgetDetail?.settings?.widget_bot_settings?.theme_mode || 'light';

  return (
    <ThemeProvider
      theme={themeMode === 'dark' ? darkThemeWidget : lightThemeWidget}
    >
      <StoreProvider widget={widgetDetail} themeMode={themeMode || 'light'}>
        {children}
      </StoreProvider>
    </ThemeProvider>
  );
};

export default Layout;
