'use client';

import { FooterSetting } from '@/assets/type';
import { FooterProvider } from '@/components/footer';
import Header from '@/components/header';
import { useStore } from '@/provider';
import Catalog from '@/views/node/Catalog';
import CatalogH5 from '@/views/node/CatalogH5';
import { Box, Stack } from '@mui/material';

const PCLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <Stack sx={{ height: '100vh', overflow: 'auto' }} id='scroll-container'>
      <Header isDocPage={true} />
      <Stack
        direction='row'
        justifyContent='center'
        alignItems='flex-start'
        gap={'96px'}
        sx={{
          pt: '50px',
          pb: 10,
          px: 5,
          flex: 1,
        }}
      >
        <Catalog />
        {children}
      </Stack>
      <FooterProvider isDocPage={true} />
    </Stack>
  );
};

const MobileLayout = ({
  children,
  footerSetting,
}: {
  children?: React.ReactNode;
  footerSetting?: FooterSetting | null;
}) => {
  return (
    <Stack
      sx={{
        position: 'relative',
        height: '100vh',
        overflow: 'auto',
        zIndex: 1,
      }}
    >
      <Box sx={{ flex: 1 }}>
        <Header />
        <CatalogH5 />
        {children}
      </Box>
      <Box
        sx={{
          mt: 5,
          bgcolor: 'background.paper3',
          ...(footerSetting?.footer_style === 'complex' && {
            borderTop: '1px solid',
            borderColor: 'divider',
          }),
        }}
      >
        <FooterProvider />
      </Box>
    </Stack>
  );
};

export default function Layout({ children }: { children: React.ReactNode }) {
  const { mobile, kbDetail } = useStore();
  const footerSetting = kbDetail?.settings?.footer_settings;

  return (
    <>
      {mobile ? (
        <MobileLayout footerSetting={footerSetting}>{children}</MobileLayout>
      ) : (
        <PCLayout>{children}</PCLayout>
      )}
    </>
  );
}
