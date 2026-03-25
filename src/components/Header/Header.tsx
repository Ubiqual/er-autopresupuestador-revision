'use client';

import HamburgerIcon from '@/assets/icons/hamburger.svg';
import LogoutIcon from '@/assets/icons/logout_icon.svg';
import ProfileIcon from '@/assets/icons/profile.svg';
import Logo from '@/assets/images/logo_purple.png';
import ShortLogo from '@/assets/images/short_logo_purple.png';
import { Button, DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui';
import { t } from '@/utils/i18n';
import type { User } from '@prisma/client';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

export default function Header() {
  const [user, setUser] = useState<User>();
  const router = useRouter();
  const pathname = usePathname();

  const fetchUser = async () => {
    const response = await fetch('/api/session');
    const data = await response.json();
    setUser(data.user);
  };

  useEffect(() => {
    fetchUser();
  }, []);

  const handleAuthMessage = useCallback((event: MessageEvent) => {
    if (event.origin !== window.location.origin) {
      return;
    }
    if (event.data?.type === 'AUTH_SUCCESS') {
      setTimeout(() => {
        fetchUser();
      }, 1000);
    }
  }, []);

  useEffect(() => {
    window.addEventListener('message', handleAuthMessage);
    return () => window.removeEventListener('message', handleAuthMessage);
  }, [handleAuthMessage]);

  const handleLogout = () => {
    document.cookie = 'userEmail=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC; Secure; SameSite=Lax;';
    router.push('/api/auth/logout');
  };

  const handleLogoClick = () => {
    if (pathname === '/') {
      // TODO: clear state instead of window.location.reload
      window.location.reload();
    } else {
      router.push('/');
    }
  };

  function shortenEmail(email: string) {
    const [localPart, domainPart] = email.split('@');
    if (!localPart || !domainPart) {
      return email;
    }
    const visibleLocal = localPart.slice(0, 4);
    return `${visibleLocal}...@${domainPart}`;
  }

  return (
    <header className="flex items-center justify-between w-full max-w-full lg:max-w-[72vw] mx-auto px-4 pt-10 bg-white">
      <div className="flex items-center">
        <div className="block lg:hidden">
          <Image
            src={ShortLogo}
            alt="Short Company Logo"
            width={150}
            height={40}
            className="object-contain cursor-pointer"
            onClick={handleLogoClick}
          />
        </div>
        <div className="hidden lg:block">
          <Image
            src={Logo}
            alt="Company Logo"
            width={265}
            height={64}
            priority
            className="object-contain cursor-pointer"
            onClick={handleLogoClick}
          />
        </div>
      </div>

      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-4 lg:hidden">
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="p-2 bg-[#3B4DA0] rounded-xl flex items-center justify-center">
                  <ProfileIcon className="text-white" width={29} height={29} />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="bottom" align="end" className="w-48">
                <DropdownMenuItem disabled className="flex items-center justify-center hover:none">
                  {shortenEmail(user.email)}
                </DropdownMenuItem>
                <DropdownMenuItem className="flex items-center justify-center hover:!bg-transparent">
                  <Button
                    variant="outline"
                    onClick={handleLogout}
                    rounded="full"
                    suffixIcon={<LogoutIcon height={28} width={28} style={{ currentColor: 'white' }} />}
                    size="sm"
                  >
                    {t('admin.buttons.logout')}
                  </Button>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <div className="block lg:hidden">
                <button
                  onClick={() => router.push('/api/auth/login')}
                  className="p-2 bg-[#3B4DA0] rounded-xl flex items-center justify-center"
                >
                  <ProfileIcon className="text-white" width={29} height={29} />
                </button>
              </div>

              <div className="hidden lg:block">
                <Button
                  onClick={() => router.push('/api/auth/login')}
                  variant="default"
                  rounded="full"
                  color="primary"
                  suffixIcon={<ProfileIcon height={22.3} width={19} style={{ currentColor: 'white' }} />}
                  size="xl"
                >
                  {t('admin.buttons.login')}
                </Button>
              </div>
            </>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="p-2">
                <HamburgerIcon width={45} height={45} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="bottom" align="end" className="w-48">
              <DropdownMenuItem onClick={() => router.push('/saved-bookings')}>
                {t('header.myBudgets')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="hidden lg:flex items-center space-x-4">
          <button onClick={() => router.push('/saved-bookings')} className="text-gray-600 hover:underline">
            {t('header.myBudgets')}
          </button>
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="p-2 bg-[#3B4DA0] rounded-xl flex items-center justify-center">
                  <ProfileIcon className="text-white" width={24} height={24} />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="bottom" align="end" className="w-48">
                <DropdownMenuItem disabled className="flex items-center justify-center hover:none">
                  {shortenEmail(user.email)}
                </DropdownMenuItem>
                <DropdownMenuItem className="flex items-center justify-center hover:!bg-transparent">
                  <Button
                    variant="outline"
                    onClick={handleLogout}
                    rounded="full"
                    suffixIcon={<LogoutIcon height={28} width={28} style={{ currentColor: 'white' }} />}
                    size="sm"
                  >
                    {t('admin.buttons.logout')}
                  </Button>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button
              onClick={() => router.push('/api/auth/login')}
              variant="default"
              rounded="full"
              color="primary"
              suffixIcon={<ProfileIcon height={22.3} width={19} style={{ currentColor: 'white' }} />}
              size="xl"
            >
              {t('admin.buttons.login')}
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
