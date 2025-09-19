'use client';

import { NodeDetail } from '@/assets/type';
import useCopy from '@/hooks/useCopy';
import { useStore } from '@/provider';
import { useParams } from 'next/navigation';
import { ConstsCopySetting } from '@/request/types';
import { TocList, useTiptap } from '@ctzhian/tiptap';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import { useEffect, useMemo, useState } from 'react';
import { Fab, Zoom, Stack, Tooltip } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DocAnchor from './DocAnchor';
import DocContent from './DocContent';
import MenuIcon from '@mui/icons-material/Menu';
import DocFab from '@/components/docFab';

const Doc = ({ node }: { node?: NodeDetail }) => {
  const { kbDetail, mobile } = useStore();
  const [headings, setHeadings] = useState<TocList>([]);
  const [characterCount, setCharacterCount] = useState(0);
  const params = useParams() || {};
  const docId = params.id as string;
  const editorRef = useTiptap({
    content: node?.content || '',
    editable: false,
    immediatelyRender: false,
    onTocUpdate: (toc: TocList) => {
      setHeadings(toc);
    },
    onCreate: ({ editor }) => {
      setCharacterCount((editor.storage as any).characterCount.characters());
    },
  });

  const docWidth = useMemo(() => {
    return kbDetail?.settings?.theme_and_style?.doc_width || 'full';
  }, [kbDetail]);

  const [showScrollTop, setShowScrollTop] = useState(false);
  const [showActions, setShowActions] = useState(false);

  useCopy({
    mode:
      kbDetail?.settings?.copy_setting !== ConstsCopySetting.CopySettingDisabled
        ? 'allow'
        : 'disable',
    blockContextMenuWhenDisabled: false,
    suffix:
      kbDetail?.settings?.copy_setting === ConstsCopySetting.CopySettingAppend
        ? `\n\n-----------------------------------------\n内容来自 ${typeof window !== 'undefined' ? window.location.href : ''}`
        : '',
  });

  const handleScroll = () => {
    setShowScrollTop(
      document.querySelector('#scroll-container')!.scrollTop > 300,
    );
  };

  useEffect(() => {
    document
      .querySelector('#scroll-container')
      ?.addEventListener('scroll', handleScroll);
    return () =>
      document
        .querySelector('#scroll-container')
        ?.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    document
      .querySelector('#scroll-container')
      ?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    if (node && editorRef && editorRef.editor) {
      requestAnimationFrame(() => {
        editorRef.editor.commands.setContent(node?.content || '');
      });
    }
  }, [node]);

  return (
    <>
      <DocContent
        info={node}
        docWidth={docWidth}
        editorRef={editorRef}
        characterCount={characterCount}
      />

      {!mobile && <DocAnchor headings={headings} />}

      <DocFab />

      {!mobile && (
        <Zoom in={showScrollTop}>
          <Fab
            size='small'
            onClick={scrollToTop}
            sx={{
              position: 'fixed',
              bottom: 20,
              right: 16,
              zIndex: 10000,
              backgroundColor: 'background.paper3',
              color: 'text.primary',
              '&:hover': {
                backgroundColor: 'background.paper2',
              },
            }}
          >
            <KeyboardArrowUpIcon sx={{ fontSize: 24 }} />
          </Fab>
        </Zoom>
      )}
    </>
  );
};

export default Doc;
