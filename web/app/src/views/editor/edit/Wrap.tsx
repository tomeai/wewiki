'use client';
import { postShareProV1FileUploadWithProgress } from '@/request/pro/otherCustomer';
import Emoji from '@/components/emoji';
import { V1NodeDetailResp } from '@/request/types';
import { Box, Stack, TextField } from '@mui/material';
import { Editor, TocList, useTiptap, UseTiptapReturn } from '@ctzhian/tiptap';
import { message } from '@ctzhian/ui';
import { IconZiti, IconAShijian2 } from '@panda-wiki/icons';
import dayjs from 'dayjs';
import { useCallback, useEffect, useState } from 'react';
import { useWrapContext } from '..';
import AIGenerate from './AIGenerate';
import Header from './Header';
import Toc from './Toc';
import Toolbar from './Toolbar';
import ConfirmModal from './ConfirmModal';
import { useParams } from 'next/navigation';

interface WrapProps {
  detail: V1NodeDetailResp;
}

const Wrap = ({ detail: defaultDetail = {} }: WrapProps) => {
  const { catalogOpen, nodeDetail, setNodeDetail, onSave } = useWrapContext();
  const { id } = useParams();

  const [characterCount, setCharacterCount] = useState(0);
  const [headings, setHeadings] = useState<TocList>([]);
  const [fixedToc, setFixedToc] = useState(false);
  const [selectionText, setSelectionText] = useState('');
  const [aiGenerateOpen, setAiGenerateOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const updateDetail = (value: V1NodeDetailResp) => {
    setNodeDetail({
      ...nodeDetail,
      updated_at: dayjs().format('YYYY-MM-DD HH:mm:ss'),
      status: 1,
      ...value,
    });
  };

  const handleUpload = async (
    file: File,
    onProgress?: (progress: { progress: number }) => void,
    abortSignal?: AbortSignal,
  ) => {
    const { key } = await postShareProV1FileUploadWithProgress(
      { file },
      {
        onprogress: ({ progress }) => {
          onProgress?.({ progress: progress / 100 });
        },
        abortSignal,
      },
    );
    return Promise.resolve('/static-file/' + key);
  };

  const handleTocUpdate = (toc: TocList) => {
    setHeadings(toc);
  };

  const handleError = (error: Error) => {
    if (error.message) {
      message.error(error.message);
    }
  };

  const handleUpdate = ({ editor }: { editor: UseTiptapReturn['editor'] }) => {
    setIsEditing(true);
    setCharacterCount((editor.storage as any).characterCount.characters());
  };

  const editorRef = useTiptap({
    editable: true,
    immediatelyRender: false,
    content: defaultDetail?.content || '',
    exclude: ['invisibleCharacters', 'youtube', 'mention'],
    onCreate: ({ editor: tiptapEditor }) => {
      setCharacterCount(
        (tiptapEditor.storage as any).characterCount.characters(),
      );
    },
    onError: handleError,
    onUpload: handleUpload,
    onUpdate: handleUpdate,
    onTocUpdate: handleTocUpdate,
  });

  const handleAiGenerate = useCallback(() => {
    if (editorRef.editor) {
      const { from, to } = editorRef.editor.state.selection;
      const text = editorRef.editor.state.doc.textBetween(from, to, '\n');
      if (!text) {
        message.error('请先选择文本');
        return;
      }
      setSelectionText(text);
      setAiGenerateOpen(true);
    }
  }, [editorRef.editor]);

  const handleGlobalSave = useCallback(
    (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === 's') {
        event.preventDefault();
        if (editorRef && editorRef.editor) {
          const html = editorRef.getHTML();
          updateDetail({
            content: html,
          });
          setConfirmModalOpen(true);
        }
      }
    },
    [editorRef, onSave],
  );

  useEffect(() => {
    document.addEventListener('keydown', handleGlobalSave);
    return () => {
      document.removeEventListener('keydown', handleGlobalSave);
    };
  }, [handleGlobalSave]);

  useEffect(() => {
    return () => {
      if (editorRef) editorRef.editor?.destroy();
    };
  }, []);

  return (
    <>
      <Box
        sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 10,
          bgcolor: 'background.default',
          transition: 'left 0.3s ease-in-out',
        }}
      >
        <Header
          edit={isEditing}
          detail={nodeDetail!}
          updateDetail={updateDetail}
          handleSave={async () => {
            setConfirmModalOpen(true);
          }}
        />
        <Toolbar editorRef={editorRef} handleAiGenerate={handleAiGenerate} />
      </Box>
      <Box
        sx={{
          ...(fixedToc && {
            display: 'flex',
          }),
        }}
      >
        <Box
          sx={{
            width: `calc(100vw - 160px - ${fixedToc ? 292 : 0}px)`,
            p: '72px 80px 150px',
            mt: '102px',
            mx: 'auto',
          }}
        >
          <Stack
            direction={'row'}
            alignItems={'center'}
            gap={1}
            sx={{ mb: 2, position: 'relative' }}
          >
            <Emoji
              type={2}
              sx={{ flexShrink: 0, width: 36, height: 36 }}
              iconSx={{ fontSize: 28 }}
              value={nodeDetail?.meta?.emoji}
              readOnly={!!id}
              onChange={value => {
                setNodeDetail({
                  ...nodeDetail,
                  meta: {
                    ...nodeDetail?.meta,
                    emoji: value,
                  },
                });
              }}
            />
            <TextField
              sx={{ flex: 1 }}
              value={nodeDetail?.name}
              placeholder='请输入文档名称'
              slotProps={{
                input: {
                  readOnly: !!id,
                  sx: {
                    fontSize: 28,
                    fontWeight: 'bold',
                    bgcolor: 'background.default',
                    '& input': {
                      p: 0,
                      lineHeight: '36px',
                      height: '36px',
                    },
                    '& fieldset': {
                      border: 'none !important',
                    },
                  },
                },
              }}
              onChange={e => {
                setNodeDetail({
                  ...nodeDetail,
                  name: e.target.value,
                });
              }}
            />
          </Stack>
          <Stack direction={'row'} alignItems={'center'} gap={2} sx={{ mb: 4 }}>
            {defaultDetail?.created_at && (
              <Stack
                direction={'row'}
                alignItems={'center'}
                gap={0.5}
                sx={{
                  fontSize: 12,
                  color: 'text.auxiliary',
                  cursor: 'text',
                  ':hover': {
                    color: 'text.auxiliary',
                  },
                }}
              >
                <IconAShijian2 />
                {dayjs(defaultDetail?.created_at).format(
                  'YYYY-MM-DD HH:mm:ss',
                )}{' '}
                创建
              </Stack>
            )}

            <Stack
              direction={'row'}
              alignItems={'center'}
              gap={0.5}
              sx={{ fontSize: 12, color: 'text.auxiliary' }}
            >
              <IconZiti />
              {characterCount} 字
            </Stack>
          </Stack>

          <Box
            sx={{
              wordBreak: 'break-all',
              '.tiptap.ProseMirror': {
                overflowX: 'hidden',
                minHeight: 'calc(100vh - 102px - 48px)',
              },
              '.tableWrapper': {
                maxWidth: `calc(100vw - 160px - ${catalogOpen ? 292 : 0}px - ${fixedToc ? 292 : 0}px)`,
                overflowX: 'auto',
              },
            }}
          >
            {editorRef.editor && <Editor editor={editorRef.editor} />}
          </Box>
        </Box>
        <Toc headings={headings} fixed={fixedToc} setFixed={setFixedToc} />
      </Box>

      <AIGenerate
        open={aiGenerateOpen}
        selectText={selectionText}
        onClose={() => setAiGenerateOpen(false)}
        editorRef={editorRef}
      />

      <ConfirmModal
        open={confirmModalOpen}
        onCancel={() => setConfirmModalOpen(false)}
        onOk={async (reason: string, token: string) => {
          const value = editorRef.getHTML();
          updateDetail({
            content: value,
          });
          await onSave(value, reason, token);
          setConfirmModalOpen(false);
        }}
      />
    </>
  );
};

export default Wrap;
