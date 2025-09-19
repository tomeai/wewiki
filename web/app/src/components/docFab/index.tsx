'use client';
import React, { useState } from 'react';
import { useStore } from '@/provider';
import { Stack, Tooltip, Fab, Zoom } from '@mui/material';
import { usePathname, useParams } from 'next/navigation';
import MenuIcon from '@mui/icons-material/Menu';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';

const DocFab = () => {
  const pathname = usePathname();
  const { id: docId } = useParams() || {};
  const { kbDetail, mobile } = useStore();
  const [showActions, setShowActions] = useState(false);

  if (mobile) return null;

  return (
    <Stack
      gap={1}
      sx={{
        position: 'fixed',
        bottom: 70,
        right: 16,
        zIndex: 10000,
      }}
      onMouseLeave={() => setShowActions(false)}
    >
      {kbDetail?.settings.contribute_settings?.is_enable && (
        <>
          <Zoom
            in={showActions}
            style={{ transitionDelay: showActions ? '100ms' : '0ms' }}
          >
            <Tooltip title='创建文档' placement='left' arrow>
              <Fab
                color='primary'
                size='small'
                onClick={() => {
                  window.open(`/editor`, '_blank');
                }}
              >
                <AddIcon />
              </Fab>
            </Tooltip>
          </Zoom>
          {pathname.startsWith('/node/') && (
            <Zoom
              in={showActions}
              style={{ transitionDelay: showActions ? '40ms' : '0ms' }}
            >
              <Tooltip title='编辑文档' placement='left' arrow>
                <Fab
                  color='primary'
                  size='small'
                  onClick={() => {
                    window.open(`/editor/${docId}`, '_blank');
                  }}
                >
                  <EditIcon />
                </Fab>
              </Tooltip>
            </Zoom>
          )}
          <Fab
            size='small'
            sx={{
              backgroundColor: 'background.paper2',
              color: 'text.secondary',
              '&:hover': { backgroundColor: 'background.paper2' },
            }}
            onMouseEnter={() => setShowActions(true)}
          >
            <MenuIcon
              sx={{
                transition: 'transform 200ms',
                transform: showActions ? 'rotate(90deg)' : 'rotate(0deg)',
              }}
            />
          </Fab>
        </>
      )}
    </Stack>
  );
};

export default DocFab;
