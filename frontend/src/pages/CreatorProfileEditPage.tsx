import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useCreatorProfile } from '@/hooks/useCreatorProfile';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Loader2, Trash2 } from 'lucide-react';
import apiClient from '@/api/client';

const profileFormSchema = z.object({
  first_name: z.string().max(30, 'Слишком длинное имя').optional(),
  last_name: z.string().max(30, 'Слишком длинная фамилия').optional(),
  username: z.string().max(30, 'Слишком длинное имя пользователя').optional(),
  bio: z.string().max(500, 'Слишком длинное описание').optional(),
  location: z.string().max(100, 'Слишком длинное название локации').optional(),
  social_links: z.array(z.object({
    platform: z.string().min(1, "Платформа не может быть пустой"),
    url: z.string().url("Неверный формат URL"),
  })).optional(),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

const CreatorProfileEditPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { creator, loading, error } = useCreatorProfile(id);
  const { user: currentUser } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      first_name: '',
      last_name: '',
      username: '',
      bio: '',
      location: '',
      social_links: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "social_links",
  });

  useEffect(() => {
    if (creator) {
      if (currentUser?.id !== creator.user?.id) {
        navigate(`/creator/${id}`);
      }
      form.reset({
        first_name: creator.user?.first_name || '',
        last_name: creator.user?.last_name || '',
        username: creator.user?.username || '',
        bio: creator.bio || '',
        location: creator.location || '',
        social_links: creator.social_links || [],
      });
    }
  }, [creator, currentUser, navigate, id, form]);

  const onSubmit = async (data: ProfileFormValues) => {
    setIsSubmitting(true);
    try {
      const { first_name, last_name, username, ...profileData } = data;
      const payload = {
        ...profileData,
        user: {
          first_name,
          last_name,
          username,
        },
      };
      await apiClient.patch(`creator-profiles/${id}/`, payload);
      navigate(`/creator/${id}`);
    } catch (err) {
      console.error('Ошибка при обновлении профиля:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return <div className="text-red-500 text-center mt-10">{error}</div>;
  }

  return (
    <div className="container mx-auto p-4 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Редактирование профиля</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="first_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Имя</FormLabel>
                      <FormControl>
                        <Input placeholder="Иван" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="last_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Фамилия</FormLabel>
                      <FormControl>
                        <Input placeholder="Иванов" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Имя пользователя</FormLabel>
                    <FormControl>
                      <Input placeholder="ivan_ivanov" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="bio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>О себе</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Расскажите о себе..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Местоположение</FormLabel>
                    <FormControl>
                      <Input placeholder="Город, страна" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div>
                <FormLabel>Социальные сети</FormLabel>
                <div className="space-y-4 mt-2">
                  {fields.map((field, index) => (
                    <div key={field.id} className="flex items-center space-x-2 p-2 border rounded-md">
                      <FormField
                        control={form.control}
                        name={`social_links.${index}.platform`}
                        render={({ field }) => (
                          <FormItem className="flex-1">
                            <FormControl>
                              <Input placeholder="Платформа (e.g. GitHub)" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`social_links.${index}.url`}
                        render={({ field }) => (
                          <FormItem className="flex-1">
                            <FormControl>
                              <Input placeholder="URL" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button type="button" variant="destructive" size="icon" onClick={() => remove(index)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={() => append({ platform: '', url: '' })}
                >
                  Добавить ссылку
                </Button>
              </div>

              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Сохранить изменения
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};

export default CreatorProfileEditPage;
