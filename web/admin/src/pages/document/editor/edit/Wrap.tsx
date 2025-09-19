import { uploadFile } from '@/api';
import Emoji from '@/components/Emoji';
import { putApiV1NodeDetail } from '@/request';
import { V1NodeDetailResp } from '@/request/types';
import { Box, Stack, TextField, Tooltip } from '@mui/material';
// import { Collaboration } from '@tiptap/extension-collaboration';
// import { CollaborationCaret } from '@tiptap/extension-collaboration-caret';
import { Editor, TocList, useTiptap, UseTiptapReturn } from '@ctzhian/tiptap';
import { Icon, message } from '@ctzhian/ui';
import dayjs from 'dayjs';
import { debounce } from 'lodash-es';
import { useCallback, useEffect, useState } from 'react';
import { useLocation, useNavigate, useOutletContext } from 'react-router-dom';
// import { WebsocketProvider } from 'y-websocket';
// import * as Y from 'yjs';
import { DocWidth } from '@/constant/enums';
import { useAppSelector } from '@/store';
import { useMemo } from 'react';
import { WrapContext } from '..';
import AIGenerate from './AIGenerate';
import Header from './Header';
import Summary from './Summary';
import Toc from './Toc';
import Toolbar from './Toolbar';

interface WrapProps {
  detail: V1NodeDetailResp;
}

const Wrap = ({ detail: defaultDetail }: WrapProps) => {
  const navigate = useNavigate();
  const { license } = useAppSelector(state => state.config);
  const state = useLocation().state as { node?: V1NodeDetailResp };
  const { catalogOpen, nodeDetail, setNodeDetail, onSave, docWidth } =
    useOutletContext<WrapContext>();

  // const connectCount = useRef(0);
  const storageTocOpen = localStorage.getItem('toc-open');

  const isEnterprise = useMemo(() => {
    return license.edition === 2;
  }, [license]);

  const [title, setTitle] = useState(nodeDetail?.name || defaultDetail.name);
  const [summary, setSummary] = useState(
    nodeDetail?.meta?.summary || defaultDetail.meta?.summary || '',
  );
  const [characterCount, setCharacterCount] = useState(0);
  const [headings, setHeadings] = useState<TocList>([]);
  const [fixedToc, setFixedToc] = useState(!!storageTocOpen);
  // const [isSyncing, setIsSyncing] = useState(false);
  // const [connectError, setConnectError] = useState(false);
  // const [collaborativeUsers, setCollaborativeUsers] = useState<
  //   Array<{
  //     id: string;
  //     name: string;
  //     color: string;
  //   }>
  // >([]);
  const [selectionText, setSelectionText] = useState('');
  const [aiGenerateOpen, setAiGenerateOpen] = useState(false);
  // const [showSummaryBtn, setShowSummaryBtn] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const updateDetail = (value: V1NodeDetailResp) => {
    setNodeDetail({
      ...nodeDetail,
      updated_at: dayjs().format('YYYY-MM-DD HH:mm:ss'),
      status: 1,
      ...value,
    });
  };

  const debouncedUpdateTitle = useCallback(
    debounce((newTitle: string) => {
      putApiV1NodeDetail({
        id: defaultDetail.id!,
        kb_id: defaultDetail.kb_id!,
        name: newTitle,
      }).then(() => {
        updateDetail({
          name: newTitle,
        });
      });
    }, 500),
    [defaultDetail.id, defaultDetail.kb_id],
  );

  const debouncedUpdateSummary = useCallback(
    debounce((newSummary: string) => {
      putApiV1NodeDetail({
        id: defaultDetail.id!,
        kb_id: defaultDetail.kb_id!,
        summary: newSummary,
      }).then(() => {
        updateDetail({
          meta: {
            ...nodeDetail?.meta,
            summary: newSummary,
          },
        });
      });
    }, 500),
    [defaultDetail.id, defaultDetail.kb_id],
  );

  const handleExport = async (type: string) => {
    if (type === 'html') {
      const html = editorRef.getHTML();
      if (!html) return;
      const blob = new Blob([html], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${nodeDetail?.name}.html`;
      a.click();
      URL.revokeObjectURL(url);
      message.success('导出成功');
    }
    if (type === 'md') {
      const markdown = editorRef.getMarkdownByJSON();
      if (!markdown) return;
      const blob = new Blob([markdown], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${nodeDetail?.name}.md`;
      a.click();
      URL.revokeObjectURL(url);
      message.success('导出成功');
    }
  };

  const handleUpload = async (
    file: File,
    onProgress?: (progress: { progress: number }) => void,
    abortSignal?: AbortSignal,
  ) => {
    const formData = new FormData();
    formData.append('file', file);
    const { key } = await uploadFile(formData, {
      onUploadProgress: ({ progress }) => {
        onProgress?.({ progress: progress / 100 });
      },
      abortSignal,
    });
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

  // const doc = useMemo(() => new Y.Doc(), [defaultDetail.id]);
  // const yprovider = useMemo(
  //   () =>
  //     new WebsocketProvider(
  //       'ws://10.10.18.71:1234',
  //       defaultDetail.id || '',
  //       doc,
  //       {
  //         maxBackoffTime: 5000,
  //       },
  //     ),
  //   [defaultDetail.id],
  // );

  // 更新协同用户列表
  // const updateCollaborativeUsers = useCallback(() => {
  //   if (yprovider && yprovider.awareness) {
  //     const states = Array.from(yprovider.awareness.getStates().values());
  //     const users = states.map((state: any) => ({
  //       id: state.user?.id || '',
  //       name: state.user?.name || '未知用户',
  //       color: state.user?.color || '#000000',
  //     }));
  //     setCollaborativeUsers(users);
  //   }
  // }, [yprovider]);

  const editorRef = useTiptap({
    editable: true,
    immediatelyRender: true,
    content: defaultDetail.content || '',
    exclude: ['invisibleCharacters', 'youtube', 'mention'],
    // exclude: ['invisibleCharacters', 'youtube', 'mention', 'undoRedo'],
    // extensions: [
    //   Collaboration.configure({
    //     document: doc,
    //   }),
    //   CollaborationCaret.configure({
    //     provider: yprovider,
    //     user: {
    //       id: user.id || '',
    //       name: user.account,
    //       color: `#${Math.floor(Math.random() * 16777215).toString(16)}`,
    //     },
    //   }),
    // ],
    onCreate: ({ editor: tiptapEditor }) => {
      setCharacterCount(
        (tiptapEditor.storage as any).characterCount.characters(),
      );
      // yprovider.on('sync', () => {
      //   if (tiptapEditor.isEmpty) {
      //     tiptapEditor.commands.setContent(defaultDetail.content || '');
      //     setCharacterCount(
      //       (tiptapEditor.storage as any).characterCount.characters(),
      //     );
      //   }
      // });
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
          onSave(html);
        }
      }
    },
    [editorRef, onSave],
  );

  useEffect(() => {
    setSummary(nodeDetail?.meta?.summary || '');
  }, [nodeDetail]);

  useEffect(() => {
    setTitle(defaultDetail?.name || '');
    setSummary(defaultDetail?.meta?.summary || '');
  }, [defaultDetail]);

  useEffect(() => {
    document.addEventListener('keydown', handleGlobalSave);
    return () => {
      document.removeEventListener('keydown', handleGlobalSave);
    };
  }, [handleGlobalSave]);

  useEffect(() => {
    if (state && state.node && editorRef.editor) {
      updateDetail({
        name: state.node.name || nodeDetail?.name || '',
        meta: {
          summary: state.node.meta?.summary || nodeDetail?.meta?.summary || '',
          emoji: state.node.meta?.emoji || nodeDetail?.meta?.emoji || '',
          // doc_width:
          //   state.node.meta?.doc_width || nodeDetail?.meta?.doc_width || 'full',
        },
        content: state.node.content || nodeDetail?.content || '',
      });
      editorRef.editor.commands.setContent(state.node.content || '');
      navigate(`/doc/editor/${defaultDetail.id}`);
    }
  }, [state, editorRef.editor]);

  // useEffect(() => {
  //   if (isSyncing) {
  //     const interval = setInterval(() => {
  //       updateCollaborativeUsers();
  //     }, 3000);
  //     return () => clearInterval(interval);
  //   }
  // }, [isSyncing]);

  useEffect(() => {
    const handleTabClose = () => {
      if (isEditing) {
        onSave(editorRef.getHTML());
        updateDetail({});
      }
    };
    const handleVisibilityChange = () => {
      if (document.hidden && isEditing) {
        onSave(editorRef.getHTML());
        updateDetail({});
      }
    };
    window.addEventListener('beforeunload', handleTabClose);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      window.removeEventListener('beforeunload', handleTabClose);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [editorRef, isEditing]);

  // const handleWebSocketError = useCallback((_error: Event, _provider: WebsocketProvider) => {
  //   _provider.disconnect();
  //   if (connectCount.current < 3) {
  //     connectCount.current++;
  //     _provider.connect();
  //   } else {
  //     if (editorRef.editor.isEmpty) {
  //       setConnectError(true);
  //       _provider.connect();
  //       editorRef.editor.commands.setContent(defaultDetail.content || '');
  //     }
  //   }
  // }, [editorRef.editor, defaultDetail.content]);

  // useEffect(() => {
  //   if (editorRef.editor) {
  //     const handleStatus = ({ status }: { status: string }) => {
  //       if (status === 'connected') {
  //         setIsSyncing(true);
  //       }
  //       if (status === 'disconnected') {
  //         setIsSyncing(false);
  //       }
  //     };

  //     yprovider.on('status', handleStatus);
  //     yprovider.on('connection-error', handleWebSocketError);

  //     return () => {
  //       yprovider.off('status', handleStatus);
  //       yprovider.off('connection-error', handleWebSocketError);
  //     };
  //   }
  // }, [yprovider, editorRef.editor, defaultDetail.content]);

  useEffect(() => {
    return () => {
      // if (doc) doc.destroy();
      // if (yprovider) yprovider.disconnect();
      if (editorRef) editorRef.editor.destroy();
    };
  }, []);

  return (
    <>
      {/* // <EditorThemeProvider
    //   colors={{ light }}
    //   mode='light'
    //   theme={{
    //     components: componentStyleOverrides,
    //   }}
    // > */}
      <Box
        sx={{
          position: 'fixed',
          top: 0,
          left: catalogOpen ? 292 : 0,
          right: 0,
          zIndex: 10,
          bgcolor: 'background.default',
          transition: 'left 0.3s ease-in-out',
        }}
      >
        <Header
          // isSyncing={isSyncing}
          // collaborativeUsers={collaborativeUsers}
          edit={isEditing}
          detail={nodeDetail!}
          updateDetail={updateDetail}
          handleSave={async () => {
            const value = editorRef.getHTML();
            updateDetail({
              content: value,
            });
            await onSave(value);
          }}
          handleExport={handleExport}
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
            width:
              docWidth === 'full'
                ? `calc(100vw - 160px - ${catalogOpen ? 292 : 0}px - ${fixedToc ? 292 : 0}px)`
                : DocWidth[docWidth as keyof typeof DocWidth].value,
            maxWidth: '100%',
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
            // onMouseEnter={() => setShowSummaryBtn(true)}
            // onMouseLeave={() => setShowSummaryBtn(false)}
          >
            {/* {showSummaryBtn && (
              <Stack
                direction={'row'}
                alignItems={'center'}
                gap={2}
                sx={{
                  position: 'absolute',
                  top: -29,
                  left: 0,
                  pb: 1,
                  width: '100%',
                  zIndex: 1,
                  fontSize: 14,
                  color: 'text.tertiary',
                }}
              >
                <Stack
                  direction={'row'}
                  alignItems={'center'}
                  gap={0.5}
                  sx={{
                    cursor: 'pointer',
                    ':hover': {
                      color: 'text.primary',
                    },
                  }}
                  onClick={() => setShowSummary(true)}
                >
                  <Icon type='icon-DJzhinengzhaiyao' />
                  智能摘要
                </Stack>
              </Stack>
            )} */}
            <Emoji
              type={2}
              sx={{ flexShrink: 0, width: 36, height: 36 }}
              iconSx={{ fontSize: 28 }}
              value={nodeDetail?.meta?.emoji}
              onChange={value => {
                putApiV1NodeDetail({
                  id: defaultDetail.id!,
                  kb_id: defaultDetail.kb_id!,
                  emoji: value,
                }).then(() => {
                  updateDetail({
                    meta: {
                      ...nodeDetail?.meta,
                      emoji: value,
                    },
                  });
                });
              }}
            />
            <TextField
              sx={{ flex: 1 }}
              value={title}
              slotProps={{
                input: {
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
                setTitle(e.target.value);
                debouncedUpdateTitle(e.target.value);
              }}
            />
          </Stack>
          <Stack direction={'row'} alignItems={'center'} gap={2} sx={{ mb: 4 }}>
            <Tooltip arrow title={isEnterprise ? '查看历史版本' : ''}>
              <Stack
                direction={'row'}
                alignItems={'center'}
                gap={0.5}
                sx={{
                  fontSize: 12,
                  color: 'text.tertiary',
                  cursor: isEnterprise ? 'pointer' : 'text',
                  ':hover': {
                    color: isEnterprise ? 'primary.main' : 'text.tertiary',
                  },
                }}
                onClick={() => {
                  if (isEnterprise) {
                    navigate(`/doc/editor/history/${defaultDetail.id}`);
                  }
                }}
              >
                <Icon type='icon-a-shijian2' />
                {dayjs(defaultDetail.created_at).format(
                  'YYYY-MM-DD HH:mm:ss',
                )}{' '}
                创建
              </Stack>
            </Tooltip>
            <Stack
              direction={'row'}
              alignItems={'center'}
              gap={0.5}
              sx={{ fontSize: 12, color: 'text.tertiary' }}
            >
              <Icon type='icon-ziti' />
              {characterCount} 字
            </Stack>
          </Stack>
          <Box
            sx={{
              mb: 6,
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: '10px',
              bgcolor: 'background.paper2',
              p: 2,
              position: 'relative',
              '.ai-generate-summary-left-icon': {
                opacity: '0',
                transition: 'opacity 0.3s ease-in-out',
              },
              ':hover': {
                '.ai-generate-summary-left-icon': {
                  opacity: '1',
                },
              },
              '.MuiInputBase-root': {
                p: 0,
              },
            }}
          >
            <Stack
              className='ai-generate-summary-left-icon'
              direction={'row'}
              alignItems={'center'}
              gap={0.5}
              onClick={() => setShowSummary(true)}
              sx={{
                position: 'absolute',
                top: -18,
                left: 0,
                zIndex: 1,
                lineHeight: '18px',
                cursor: 'pointer',
                fontSize: 12,
                color: 'text.tertiary',
                ':hover': {
                  color: 'text.primary',
                },
              }}
            >
              <Icon type='icon-DJzhinengzhaiyao' sx={{ fontSize: 12 }} />
              文档摘要
            </Stack>
            {nodeDetail?.meta?.summary ? (
              <TextField
                value={summary}
                multiline
                fullWidth
                placeholder='暂无摘要，可在此处输入摘要'
                slotProps={{
                  input: {
                    sx: {
                      bgcolor: 'background.paper2',
                      fontSize: 14,
                      lineHeight: '28px',
                      letterSpacing: '1px',
                      fontWeight: 'normal',
                      color: 'text.secondary',
                      '& fieldset': {
                        border: 'none !important',
                      },
                    },
                  },
                }}
                onChange={e => {
                  setSummary(e.target.value);
                  debouncedUpdateSummary(e.target.value);
                }}
              />
            ) : (
              <Box sx={{ fontSize: 12, color: 'text.tertiary' }}>
                暂无摘要，点击
                <Box
                  component='span'
                  sx={{ color: 'primary.main', cursor: 'pointer' }}
                  onClick={() => setShowSummary(true)}
                >
                  生成摘要
                </Box>
              </Box>
            )}
          </Box>
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
            <Editor editor={editorRef.editor} />
            {/* {(isSyncing || connectError) ? <Editor editor={editorRef.editor} /> : <Stack gap={1}>
              {new Array(3).fill(0).map((_, index) => (
                <Skeleton key={index} variant='text' height={24} />
              ))}
              <Skeleton width={500} variant='text' height={24} />
              {new Array(5).fill(0).map((_, index) => (
                <Skeleton key={index} variant='text' height={24} />
              ))}
              <Skeleton width={400} variant='text' height={24} />
              {new Array(2).fill(0).map((_, index) => (
                <Skeleton key={index} variant='text' height={24} />
              ))}
              <Skeleton width={300} variant='text' height={24} />
              {new Array(5).fill(0).map((_, index) => (
                <Skeleton key={index} variant='text' height={24} />
              ))}
              <Skeleton width={500} variant='text' height={24} />
              {new Array(3).fill(0).map((_, index) => (
                <Skeleton key={index} variant='text' height={24} />
              ))}
              <Skeleton width={300} variant='text' height={24} />
            </Stack>} */}
          </Box>
        </Box>
        <Toc
          headings={headings}
          fixed={fixedToc}
          setFixed={setFixedToc}
          setShowSummary={setShowSummary}
        />
      </Box>
      <AIGenerate
        open={aiGenerateOpen}
        selectText={selectionText}
        onClose={() => setAiGenerateOpen(false)}
        editorRef={editorRef}
      />
      <Summary
        open={showSummary}
        updateDetail={updateDetail}
        onClose={() => setShowSummary(false)}
      />
      {/* </EditorThemeProvider> */}
    </>
  );
};

export default Wrap;
