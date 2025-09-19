import Catalog from '@/views/node/Catalog';
import { FooterProvider } from '@/components/footer';
import Header from '@/components/header';
import { Stack } from '@mui/material';
import DocFab from '@/components/docFab';

const Layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <Stack sx={{ height: '100vh', overflow: 'auto' }} id='scroll-container'>
      <Header isDocPage={true} isWelcomePage={true} />
      <Stack
        direction='row'
        justifyContent='center'
        alignItems='flex-start'
        gap={2}
        sx={{
          flex: 1,
          position: 'relative',
          zIndex: 1,
          pb: 10,
          pl: 5,
          '@media (max-width: 1200px)': {
            pl: 0,
          },
        }}
      >
        <Catalog sx={{ mt: '42px' }} />
        {children}
      </Stack>
      <DocFab />
      <FooterProvider isDocPage={true} isWelcomePage={true} />
    </Stack>
  );
};

export default Layout;
