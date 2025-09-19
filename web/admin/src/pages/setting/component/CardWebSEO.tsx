import { SEOSetting } from '@/api';
import { Checkbox, TextField } from '@mui/material';
import { message } from '@ctzhian/ui';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { DomainAppDetailResp } from '@/request/types';
import { SettingCardItem, FormItem } from './Common';
import { useAppSelector } from '@/store';
import { putApiV1App } from '@/request/App';

interface CardWebSEOProps {
  id: string;
  data: DomainAppDetailResp;
  refresh: (value: SEOSetting) => void;
}

const CardWebSEO = ({ data, id, refresh }: CardWebSEOProps) => {
  const [isEdit, setIsEdit] = useState(false);
  const { kb_id } = useAppSelector(state => state.config);
  const {
    handleSubmit,
    control,
    setValue,
    formState: { errors },
  } = useForm<SEOSetting>({
    defaultValues: {
      desc: '',
      keyword: '',
      auto_sitemap: false,
    },
  });

  const onSubmit = handleSubmit((value: SEOSetting) => {
    putApiV1App(
      { id },
      { kb_id, settings: { ...data.settings, ...value } },
    ).then(() => {
      message.success('保存成功');
      refresh(value);
      setIsEdit(false);
    });
  });

  useEffect(() => {
    setValue('desc', data.settings?.desc || '');
    setValue('keyword', data.settings?.keyword || '');
    setValue('auto_sitemap', data.settings?.auto_sitemap ?? false);
  }, [data]);

  return (
    <SettingCardItem title='SEO' isEdit={isEdit} onSubmit={onSubmit}>
      <FormItem label='网站描述'>
        <Controller
          control={control}
          name='desc'
          render={({ field }) => (
            <TextField
              fullWidth
              {...field}
              placeholder='输入网站描述'
              error={!!errors.desc}
              helperText={errors.desc?.message}
              onChange={event => {
                setIsEdit(true);
                field.onChange(event);
              }}
            />
          )}
        />
      </FormItem>

      <FormItem label='关键词'>
        <Controller
          control={control}
          name='keyword'
          render={({ field }) => (
            <TextField
              fullWidth
              {...field}
              placeholder='输入关键词'
              error={!!errors.keyword}
              helperText={errors.keyword?.message}
              onChange={event => {
                setIsEdit(true);
                field.onChange(event);
              }}
            />
          )}
        />
      </FormItem>

      <FormItem label='自动生成 Sitemap'>
        <Controller
          control={control}
          name='auto_sitemap'
          render={({ field }) => (
            <Checkbox
              {...field}
              checked={field.value}
              size='small'
              sx={{ p: 0, m: 0 }}
              onChange={event => {
                setIsEdit(true);
                field.onChange(event);
              }}
            />
          )}
        />
      </FormItem>
    </SettingCardItem>
  );
};
export default CardWebSEO;
