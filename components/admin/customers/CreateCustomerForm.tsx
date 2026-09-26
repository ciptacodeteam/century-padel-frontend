'use client';

import { Button } from '@/components/ui/button';
import { useDialog } from '@/components/ui/dialog';
import { Field, FieldError, FieldGroup, FieldLabel, FieldSet } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { InputGroup, InputGroupText } from '@/components/ui/input-group';
import { formatPhone } from '@/lib/utils';
import { adminCreateCustomerMutationOptions } from '@/mutations/admin/customer';
import { adminCustomersQueryOptions } from '@/queries/admin/customer';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { type SubmitHandler, useForm } from 'react-hook-form';
import z from 'zod';

const formSchema = z.object({
  firstName: z.string().trim().min(1, 'Nama depan wajib diisi').max(50),
  lastName: z.string().trim().min(1, 'Nama belakang wajib diisi').max(50),
  email: z.string().email('Email tidak valid').max(100).optional().or(z.literal('')),
  phone: z
    .string()
    .min(10, 'Nomor telepon minimal 10 digit')
    .max(15, 'Nomor telepon maksimal 15 digit')
});

type FormSchema = z.infer<typeof formSchema>;

const CreateCustomerForm = () => {
  const form = useForm<FormSchema>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: ''
    }
  });
  const { closeDialog } = useDialog();
  const queryClient = useQueryClient();

  const { mutate, isPending } = useMutation(
    adminCreateCustomerMutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: adminCustomersQueryOptions.queryKey });
        closeDialog('create-customer');
        form.reset();
      },
      onError: (err) => {
        if (err.errors?.name === 'ZodError') {
          const fieldErrors = err.errors.fields as Record<string, string>;
          Object.entries(fieldErrors).forEach(([fieldName, message]) => {
            form.setError(fieldName as keyof FormSchema, {
              type: 'server',
              message
            });
          });
        }
      }
    })
  );

  const onSubmit: SubmitHandler<FormSchema> = (formData) => {
    mutate({
      ...formData,
      phone: formatPhone(formData.phone)
    });
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <FieldSet>
        <FieldGroup>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="customerFirstName">Nama Depan</FieldLabel>
              <Input
                id="customerFirstName"
                {...form.register('firstName')}
                placeholder="e.g. John"
              />
              <FieldError>{form.formState.errors.firstName?.message}</FieldError>
            </Field>
            <Field>
              <FieldLabel htmlFor="customerLastName">Nama Belakang</FieldLabel>
              <Input id="customerLastName" {...form.register('lastName')} placeholder="e.g. Doe" />
              <FieldError>{form.formState.errors.lastName?.message}</FieldError>
            </Field>
          </div>
          <Field>
            <FieldLabel htmlFor="customerPhone">Nomor Telepon</FieldLabel>
            <InputGroup>
              <InputGroupText className="px-3">+62</InputGroupText>
              <Input
                id="customerPhone"
                type="tel"
                {...form.register('phone')}
                placeholder="e.g. 81234567890"
                onBlur={(event) => {
                  const value = event.target.value ?? '';
                  if (value.startsWith('0')) {
                    const normalizedValue = value.replace(/^0/, '');
                    event.currentTarget.value = normalizedValue;
                    form.setValue('phone', normalizedValue, {
                      shouldDirty: true,
                      shouldTouch: true,
                      shouldValidate: true
                    });
                  }
                }}
                onBeforeInput={(event) => {
                  const char = event.data;
                  if (char && !/[\d\s]/.test(char)) event.preventDefault();
                }}
              />
            </InputGroup>
            <FieldError>{form.formState.errors.phone?.message}</FieldError>
          </Field>
          <Field>
            <FieldLabel htmlFor="customerEmail">Email (Opsional)</FieldLabel>
            <Input
              id="customerEmail"
              type="email"
              {...form.register('email')}
              placeholder="e.g. john.doe@example.com"
            />
            <FieldError>{form.formState.errors.email?.message}</FieldError>
          </Field>
          <Field className="mt-2 ml-auto w-fit">
            <div className="flex items-center gap-4">
              <Button type="button" variant="ghost" onClick={() => closeDialog('create-customer')}>
                Batal
              </Button>
              <Button type="submit" loading={isPending}>
                Simpan
              </Button>
            </div>
          </Field>
        </FieldGroup>
      </FieldSet>
    </form>
  );
};

export default CreateCustomerForm;
