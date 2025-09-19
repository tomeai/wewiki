import React, { useMemo, useState, useEffect } from 'react';
import { SettingCardItem, SettingCard, FormItem } from './Common';
import { useAppSelector } from '@/store';
import { useForm, Controller } from 'react-hook-form';
import { putApiV1App } from '@/request/App';
import {
  Radio,
  RadioGroup,
  FormControlLabel,
  TextField,
  styled,
  Autocomplete,
} from '@mui/material';
import { message } from '@ctzhian/ui';
import {
  DomainAppDetailResp,
  DomainKnowledgeBaseDetail,
  ConstsWatermarkSetting,
  ConstsCopySetting,
} from '@/request/types';
import { getApiProV1Block, postApiProV1Block } from '@/request/pro/Block';

const StyledRadioLabel = styled('div')(({ theme }) => ({
  width: 100,
}));

const WatermarkForm = ({
  data,
  refresh,
}: {
  data?: DomainAppDetailResp;
  refresh: () => void;
}) => {
  const { license, kb_id } = useAppSelector(state => state.config);
  const [watermarkIsEdit, setWatermarkIsEdit] = useState(false);
  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: {
      watermark_setting: data?.settings?.watermark_setting ?? null,
      watermark_content: data?.settings?.watermark_content ?? '',
    },
  });

  const watermarkSetting = watch('watermark_setting');
  const isEnterprise = useMemo(() => {
    return license.edition === 2;
  }, [license]);

  const handleSaveWatermark = handleSubmit(values => {
    if (!data?.id || values.watermark_setting === null) return;
    putApiV1App(
      { id: data.id },
      {
        kb_id,
        settings: {
          ...data?.settings,
          watermark_setting: values.watermark_setting,
          watermark_content: values.watermark_content,
        },
      },
    ).then(() => {
      message.success('保存成功');
      setWatermarkIsEdit(false);
      refresh();
    });
  });

  useEffect(() => {
    if (!data) return;
    setValue('watermark_setting', data.settings?.watermark_setting ?? null);
    setValue('watermark_content', data.settings?.watermark_content ?? '');
  }, [data]);

  return (
    <SettingCardItem
      title='水印'
      isEdit={watermarkIsEdit}
      onSubmit={handleSaveWatermark}
    >
      <FormItem label='水印开关' tooltip={!isEnterprise && '企业版可用'}>
        <Controller
          control={control}
          name='watermark_setting'
          render={({ field }) => (
            <RadioGroup
              row
              {...field}
              onChange={e => {
                setWatermarkIsEdit(true);
                field.onChange(e.target.value);
              }}
            >
              <FormControlLabel
                value={ConstsWatermarkSetting.WatermarkVisible}
                control={<Radio size='small' disabled={!isEnterprise} />}
                label={<StyledRadioLabel>显性水印</StyledRadioLabel>}
              />
              <FormControlLabel
                value={ConstsWatermarkSetting.WatermarkHidden}
                control={<Radio size='small' disabled={!isEnterprise} />}
                label={<StyledRadioLabel>隐形水印</StyledRadioLabel>}
              />

              <FormControlLabel
                value={ConstsWatermarkSetting.WatermarkDisabled}
                control={<Radio size='small' disabled={!isEnterprise} />}
                label={<StyledRadioLabel>禁用</StyledRadioLabel>}
              />
            </RadioGroup>
          )}
        />
      </FormItem>
      {watermarkSetting !== ConstsWatermarkSetting.WatermarkDisabled && (
        <FormItem label='水印内容' sx={{ alignItems: 'flex-start' }}>
          <Controller
            control={control}
            name='watermark_content'
            render={({ field }) => (
              <TextField
                fullWidth
                {...field}
                placeholder='请输入水印内容, 支持多行输入'
                multiline
                minRows={2}
                disabled={!isEnterprise}
                onChange={e => {
                  setWatermarkIsEdit(true);
                  field.onChange(e.target.value);
                }}
              />
            )}
          />
        </FormItem>
      )}
    </SettingCardItem>
  );
};

const KeywordsForm = ({ kb }: { kb: DomainKnowledgeBaseDetail }) => {
  const { license } = useAppSelector(state => state.config);
  const [questionInputValue, setQuestionInputValue] = useState('');
  const [isEdit, setIsEdit] = useState(false);
  const isEnterprise = useMemo(() => {
    return license.edition === 2;
  }, [license]);

  const { control, handleSubmit, setValue } = useForm({
    defaultValues: {
      interval: 0,
      content: '',
      block_words: [] as string[],
    },
  });

  const onSubmit = handleSubmit(async data => {
    await postApiProV1Block({
      kb_id: kb.id!,
      block_words: data.block_words,
    });

    message.success('保存成功');
    setIsEdit(false);
  });

  useEffect(() => {
    if (!kb.id || !isEnterprise) return;
    getApiProV1Block({ kb_id: kb.id! }).then(res => {
      setValue('block_words', res.words || []);
    });
  }, [kb, isEnterprise]);

  return (
    <SettingCardItem title='内容合规' isEdit={isEdit} onSubmit={onSubmit}>
      <FormItem
        vertical
        tooltip={!isEnterprise && '企业版可用'}
        label='屏蔽 AI 问答中的关键字'
      >
        <Controller
          control={control}
          name='block_words'
          render={({ field }) => (
            <Autocomplete
              {...field}
              multiple
              freeSolo
              inputValue={questionInputValue}
              options={[]}
              fullWidth
              disabled={!isEnterprise}
              onInputChange={(_, value) => {
                setQuestionInputValue(value);
              }}
              onChange={(_, newValue) => {
                setIsEdit(true);

                const newValues = [...new Set(newValue as string[])];
                field.onChange(newValues);
              }}
              renderInput={params => (
                <TextField
                  {...params}
                  placeholder='屏蔽 AI 问答中的关键字，可输入多个，回车确认'
                  variant='outlined'
                  onBlur={() => {
                    // 失去焦点时自动添加当前输入的值
                    const trimmedValue = questionInputValue.trim();
                    if (trimmedValue && !field.value.includes(trimmedValue)) {
                      setIsEdit(true);
                      field.onChange([...field.value, trimmedValue]);
                      setQuestionInputValue('');
                    }
                  }}
                />
              )}
            />
          )}
        />
      </FormItem>
    </SettingCardItem>
  );
};

const CopyForm = ({
  data,
  refresh,
}: {
  data?: DomainAppDetailResp;
  refresh: () => void;
}) => {
  const { license, kb_id } = useAppSelector(state => state.config);
  const [isEdit, setIsEdit] = useState(false);
  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm({
    defaultValues: {
      copy_setting: data?.settings?.copy_setting ?? null,
    },
  });

  const isEnterprise = useMemo(() => {
    return license.edition === 2;
  }, [license]);

  const handleSaveWatermark = handleSubmit(values => {
    if (!data?.id || values.copy_setting === null) return;
    putApiV1App(
      { id: data.id },
      {
        kb_id,
        settings: {
          ...data?.settings,
          copy_setting: values.copy_setting,
        },
      },
    ).then(() => {
      refresh();
      message.success('保存成功');
      setIsEdit(false);
    });
  });

  useEffect(() => {
    if (!data) return;
    setValue('copy_setting', data.settings?.copy_setting ?? null);
  }, [data]);

  return (
    <SettingCardItem
      title='内容复制'
      isEdit={isEdit}
      onSubmit={handleSaveWatermark}
    >
      <FormItem label='限制复制' tooltip={!isEnterprise && '企业版可用'}>
        <Controller
          control={control}
          name='copy_setting'
          render={({ field }) => (
            <RadioGroup
              row
              {...field}
              onChange={e => {
                setIsEdit(true);
                field.onChange(e.target.value);
              }}
            >
              <FormControlLabel
                value={ConstsCopySetting.CopySettingNone}
                control={<Radio size='small' disabled={!isEnterprise} />}
                label={<StyledRadioLabel>不做限制</StyledRadioLabel>}
              />
              <FormControlLabel
                value={ConstsCopySetting.CopySettingAppend}
                control={<Radio size='small' disabled={!isEnterprise} />}
                label={<StyledRadioLabel>增加内容尾巴</StyledRadioLabel>}
              />

              <FormControlLabel
                value={ConstsCopySetting.CopySettingDisabled}
                control={<Radio size='small' disabled={!isEnterprise} />}
                label={<StyledRadioLabel>禁止复制内容</StyledRadioLabel>}
              />
            </RadioGroup>
          )}
        />
      </FormItem>
    </SettingCardItem>
  );
};

const CardSecurity = ({
  data,
  kb,
  refresh,
}: {
  data?: DomainAppDetailResp;
  kb: DomainKnowledgeBaseDetail;
  refresh: () => void;
}) => {
  return (
    <SettingCard title='安全'>
      <WatermarkForm data={data} refresh={refresh} />
      <CopyForm data={data} refresh={refresh} />
      <KeywordsForm kb={kb} />
    </SettingCard>
  );
};

export default CardSecurity;
