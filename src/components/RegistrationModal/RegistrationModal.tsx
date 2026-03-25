import updateUserData from '@/app/api/updateUserdata';
import ArrowLeft from '@/assets/icons/left-arrow.svg';
import ArrowRight from '@/assets/icons/right-arrow.svg';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { zodResolver } from '@hookform/resolvers/zod';
import type { User } from '@prisma/client';
import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';

interface RegistrationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUserInfoSaved?: () => Promise<void>;
  onEditClient?: (client: User) => void;
  defaultUserData?: User | null;
  disableRequiredFields?: boolean;
}

export function RegistrationModal({
  open,
  onOpenChange,
  onUserInfoSaved,
  onEditClient,
  defaultUserData,
  disableRequiredFields
}: RegistrationModalProps) {
  const formSchema = z
    .object({
      fullName: z.string().refine((val) => disableRequiredFields || val.trim().length > 0, {
        message: 'El nombre completo es requerido'
      }),
      email: z.string().email('Correo electrónico no válido'),
      address: z.string().refine((val) => disableRequiredFields || val.trim().length > 0, {
        message: 'La dirección es requerida'
      }),
      postalCode: z.string().refine((val) => disableRequiredFields || val.trim().length > 0, {
        message: 'El código postal es requerido'
      }),
      province: z.string().refine((val) => disableRequiredFields || val.trim().length > 0, {
        message: 'La provincia es requerida'
      }),
      city: z.string().refine((val) => disableRequiredFields || val.trim().length > 0, {
        message: 'La población es requerida'
      }),
      phone: z.string().refine((val) => disableRequiredFields || val.trim().length > 0, {
        message: 'El teléfono es requerido'
      }),
      country: z.string().refine((val) => disableRequiredFields || val.trim().length > 0, {
        message: 'El país es requerido'
      }),
      docId: z.string().refine((val) => disableRequiredFields || val.trim().length > 0, {
        message: 'El documento de identificación es requerido'
      }),
      isCompany: z.boolean(),
      companyName: z.string().optional()
    })
    .refine((data) => !data.isCompany || (data.isCompany && data.companyName && data.companyName.trim().length > 0), {
      message: 'El nombre de la empresa es requerido',
      path: ['companyName']
    });

  const defaultValues = {
    fullName: defaultUserData?.fullName || '',
    email: defaultUserData?.email || '',
    address: defaultUserData?.address || '',
    postalCode: defaultUserData?.postalCode || '',
    city: defaultUserData?.city || '',
    province: defaultUserData?.province || '',
    country: defaultUserData?.country || '',
    phone: defaultUserData?.phone ? defaultUserData.phone.toString() : '',
    isCompany: !!defaultUserData?.contacto,
    docId: defaultUserData?.docId || '',
    companyName: defaultUserData?.contacto || ''
  };

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues
  });

  const isNewUser = !defaultUserData?.email;

  useEffect(() => {
    form.reset({
      fullName: defaultUserData?.fullName || '',
      email: defaultUserData?.email || '',
      address: defaultUserData?.address || '',
      postalCode: defaultUserData?.postalCode || '',
      city: defaultUserData?.city || '',
      province: defaultUserData?.province || '',
      country: defaultUserData?.country || '',
      phone: defaultUserData?.phone ? defaultUserData.phone.toString() : '',
      isCompany: !!defaultUserData?.contacto,
      docId: defaultUserData?.docId || '',
      companyName: defaultUserData?.contacto || ''
    });
  }, [defaultUserData, form]);

  const isCompany = form.watch('isCompany');

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    const updatedUserData = {
      fullName: data.fullName.trim(),
      email: data.email,
      address: data.address,
      postalCode: data.postalCode,
      city: data.city,
      province: data.province,
      country: data.country,
      phone: data.phone,
      docId: data.docId,
      contacto: data.isCompany && data.companyName ? data?.companyName.trim() : data.fullName.trim()
    };

    const updatedUser = await updateUserData(updatedUserData);
    if (onUserInfoSaved) {
      await onUserInfoSaved();
    }
    if (onEditClient) {
      onEditClient(updatedUser);
    }
    onOpenChange(false);
    form.reset();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="fixed inset-0 bg-[#F5F5F5] p-4 w-full h-full flex flex-col items-center justify-center 
          top-1/2 left-1/2 xl:transform xl:-translate-x-1/2 xl:-translate-y-1/2 
          max-h-[100%] max-w-[100%] xl:rounded-lg xl:shadow-lg 
          xl:w-[90%] xl:max-w-[75vw] xl:h-[85%] z-50"
      >
        <div className="w-full max-h-[90%] overflow-y-auto">
          <DialogTitle className="text-center text-2xl font-semibold">Regístrate</DialogTitle>
          <DialogDescription className="text-center mt-1 text-gray-500">
            Por favor, completa todos los campos requeridos.
          </DialogDescription>

          <div className="flex items-center justify-center gap-4 my-6">
            <span className={!isCompany ? 'font-semibold' : ''}>personal</span>
            <Switch checked={isCompany} onCheckedChange={(checked) => form.setValue('isCompany', checked)} />
            <span className={isCompany ? 'font-semibold' : ''}>empresa</span>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre completo {disableRequiredFields ? '' : '*'}</FormLabel>
                    <FormControl>
                      <Input placeholder="Tu nombre completo" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Correo electrónico *</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="correo@ejemplo.com"
                        {...field}
                        readOnly={!!defaultUserData?.email}
                        disabled={!isNewUser}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Dirección {disableRequiredFields ? '' : '*'}</FormLabel>
                    <FormControl>
                      <Input placeholder="Calle, número, piso..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="postalCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Código postal {disableRequiredFields ? '' : '*'}</FormLabel>
                      <FormControl>
                        <Input placeholder="28001" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="province"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Provincia {disableRequiredFields ? '' : '*'}</FormLabel>
                      <FormControl>
                        <Input placeholder="Madrid" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Población {disableRequiredFields ? '' : '*'}</FormLabel>
                      <FormControl>
                        <Input placeholder="Madrid" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Teléfono {disableRequiredFields ? '' : '*'}</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="600 000 000" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="country"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>País {disableRequiredFields ? '' : '*'}</FormLabel>
                      <FormControl>
                        <Input placeholder="España" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="docId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Documento de identidad {disableRequiredFields ? '' : '*'}</FormLabel>
                      <FormControl>
                        <Input placeholder="Documento de identidad" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {isCompany && (
                <FormField
                  control={form.control}
                  name="companyName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre de la empresa {disableRequiredFields ? '' : '*'}</FormLabel>
                      <FormControl>
                        <Input placeholder="Nombre de la empresa" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </form>
          </Form>
        </div>
        <DialogFooter>
          <footer className="flex xl:flex-row flex-col-reverse sm:justify-center items-center gap-2">
            <Button
              variant="outline"
              rounded="full"
              size="xl"
              prefixIcon={<ArrowLeft height={28} width={28} />}
              onClick={() => onOpenChange(false)}
              type="button"
            >
              Atrás
            </Button>
            <Button
              variant="default"
              rounded="full"
              color="primary"
              size="xl"
              suffixIcon={<ArrowRight height={28} width={28} />}
              type="submit"
              loading={form.formState.isSubmitting}
            >
              Confirmar
            </Button>
          </footer>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
