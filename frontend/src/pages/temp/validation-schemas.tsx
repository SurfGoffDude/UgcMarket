// Схемы валидации форм
import * as z from 'zod';

// Схема для навыков
const skillSchema = z.object({
  name: z.string().min(1, 'Название навыка обязательно')
});

// Схема для портфолио
const portfolioItemSchema = z.object({
  title: z.string().min(1, 'Название работы обязательно'),
  description: z.string().min(1, 'Описание работы обязательно'),
  category: z.string().optional(),
  image: z.any().optional()
});

// Схема для социальных сетей
const socialLinksSchema = z.object({
  website: z.string().url({ message: 'Некорректный URL' }).optional().or(z.literal('')),
  twitter: z.string().url({ message: 'Некорректный URL' }).optional().or(z.literal('')),
  instagram: z.string().url({ message: 'Некорректный URL' }).optional().or(z.literal('')),
  linkedin: z.string().url({ message: 'Некорректный URL' }).optional().or(z.literal('')),
  github: z.string().url({ message: 'Некорректный URL' }).optional().or(z.literal(''))
});

// Схема для услуг
const serviceSchema = z.object({
  title: z.string().min(1, 'Название услуги обязательно'),
  description: z.string().min(1, 'Описание услуги обязательно'),
  price: z.string().refine((val) => !Number.isNaN(parseFloat(val)), {
    message: 'Цена должна быть числом'
  })
});

// Типы для форм
type SkillFormValues = z.infer<typeof skillSchema>;
type PortfolioItemFormValues = z.infer<typeof portfolioItemSchema>;
type ServiceFormValues = z.infer<typeof serviceSchema>;
type SocialLinksFormValues = z.infer<typeof socialLinksSchema>;

export {
  skillSchema,
  portfolioItemSchema,
  socialLinksSchema,
  serviceSchema,
  SkillFormValues,
  PortfolioItemFormValues,
  ServiceFormValues,
  SocialLinksFormValues
};