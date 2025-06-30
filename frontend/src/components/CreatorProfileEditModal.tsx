import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useCreatorProfile } from '@/hooks/useCreatorProfile';

const profileSchema = z.object({
  first_name: z.string().min(1, 'Имя обязательно для заполнения'),
  last_name: z.string().min(1, 'Фамилия обязательна для заполнения'),
  phone: z.string().optional(),
  bio: z.string().optional(),
  location: z.string().optional(),
  portfolio_link: z.string().url('Неверный формат URL').optional().or(z.literal('')),
  niche: z.string().optional(),
  experience_years: z.number().min(0).optional(),
  languages: z.string().optional(),
  social_media: z.array(z.object({
    platform: z.string(),
    link: z.string().url('Неверный формат URL')
  })).optional()
});

type ProfileFormValues = z.infer<typeof profileSchema>;

interface CreatorProfileEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  creator: any; // Типизируйте в соответствии с вашими данными
  onProfileUpdate: () => void;
}

const CreatorProfileEditModal: React.FC<CreatorProfileEditModalProps> = ({ isOpen, onClose, creator, onProfileUpdate }) => {
  const { updateProfile, loading: isUpdating } = useCreatorProfile(creator?.id);
  
  const { register, handleSubmit, control, reset, formState: { errors } } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      first_name: '',
      last_name: '',
      phone: '',
      bio: '',
      location: '',
      portfolio_link: '',
      niche: '',
      experience_years: 0,
      languages: '',
      social_media: []
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "social_media"
  });

  useEffect(() => {
    if (creator) {
      reset({
        first_name: creator.user.first_name || '',
        last_name: creator.user.last_name || '',
        phone: creator.user.phone || '',
        bio: creator.user.bio || '',
        location: creator.user.location || '',
        portfolio_link: creator.portfolio_link || '',
        niche: creator.niche || '',
        experience_years: creator.experience_years || 0,
        languages: creator.languages ? creator.languages.join(', ') : '',
        social_media: creator.social_media_links || []
      });
    }
  }, [creator, reset]);

  const onSubmit = async (data: ProfileFormValues) => {
    const profileData = {
        ...data,
        languages: data.languages?.split(',').map(lang => lang.trim()),
        social_media_links: data.social_media
    };
    
    // @ts-ignore
    delete profileData.social_media;

    try {
        await updateProfile(profileData);
        onProfileUpdate();
        onClose();
    } catch (error) {

    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Редактировать профиль</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 py-4 max-h-[80vh] overflow-y-auto pr-2">
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <Label htmlFor="first_name">Имя</Label>
                    <Input id="first_name" {...register('first_name')} />
                    {errors.first_name && <p className="text-red-500 text-xs mt-1">{errors.first_name.message}</p>}
                </div>
                <div>
                    <Label htmlFor="last_name">Фамилия</Label>
                    <Input id="last_name" {...register('last_name')} />
                    {errors.last_name && <p className="text-red-500 text-xs mt-1">{errors.last_name.message}</p>}
                </div>
            </div>
            <div>
                <Label htmlFor="phone">Телефон</Label>
                <Input id="phone" {...register('phone')} />
            </div>
            <div>
                <Label htmlFor="bio">О себе</Label>
                <Textarea id="bio" {...register('bio')} />
            </div>
            <div>
                <Label htmlFor="location">Местоположение (Город, Страна)</Label>
                <Input id="location" {...register('location')} />
            </div>
            <div className="grid grid-cols-2 gap-4">
                 <div>
                    <Label htmlFor="niche">Ниша</Label>
                    <Input id="niche" {...register('niche')} />
                </div>
                <div>
                    <Label htmlFor="experience_years">Опыт (лет)</Label>
                    <Input id="experience_years" type="number" {...register('experience_years', { valueAsNumber: true })} />
                </div>
            </div>
            <div>
                <Label htmlFor="languages">Языки (через запятую)</Label>
                <Input id="languages" {...register('languages')} />
            </div>
            <div>
                <Label htmlFor="portfolio_link">Ссылка на портфолио</Label>
                <Input id="portfolio_link" {...register('portfolio_link')} />
                {errors.portfolio_link && <p className="text-red-500 text-xs mt-1">{errors.portfolio_link.message}</p>}
            </div>
            
            <div>
              <Label>Социальные сети</Label>
              {fields.map((field, index) => (
                <div key={field.id} className="flex items-center gap-2 mb-2">
                  <Input {...register(`social_media.${index}.platform`)} placeholder="Платформа" className="w-1/3" />
                  <Input {...register(`social_media.${index}.link`)} placeholder="Ссылка" className="w-2/3" />
                  <Button type="button" variant="destructive" size="sm" onClick={() => remove(index)}>-</Button>
                </div>
              ))}
              <Button type="button" variant="outline" size="sm" onClick={() => append({ platform: '', link: '' })}>
                Добавить соц. сеть
              </Button>
            </div>

            <DialogFooter>
              <Button type="button" variant="secondary" onClick={onClose}>Отмена</Button>
              <Button type="submit" disabled={isUpdating}>{isUpdating ? 'Сохранение...' : 'Сохранить'}</Button>
            </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreatorProfileEditModal;