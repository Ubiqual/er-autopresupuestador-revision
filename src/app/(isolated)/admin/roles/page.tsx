'use client';

import { deleteUserRole, getUsers, getUsersCount, updateUserRole } from '@/app/api/updateUsersRole';
import { RegistrationModal } from '@/components/RegistrationModal/RegistrationModal';
import { Button } from '@/components/ui';
import { LoadingContainer, LoadingContent } from '@/components/ui/loading';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useDebounce } from '@/hooks/useDebounce'; // Import the useDebounce hook
import { UserRoles } from '@/types/UserRole';
import { t } from '@/utils/i18n';
import type { User, UserRole } from '@prisma/client';
import React, { useEffect, useState } from 'react';

const RolesPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<UserRole | ''>('');
  const [tableLoading, setTableLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showRegistrationModal, setShowRegistrationModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const fetchUsers = async (query = searchQuery, role = roleFilter, page = currentPage) => {
    setTableLoading(true);
    const limit = 10;
    const fetchedUsers = await getUsers(page, limit, query, role);
    const totalUsers = await getUsersCount(query, role);
    setUsers(fetchedUsers);
    setTotalPages(Math.ceil(totalUsers / limit));
    setTableLoading(false);
  };

  useEffect(() => {
    fetchUsers();
  }, [currentPage, roleFilter]);

  const debouncedSearchQuery = useDebounce(searchQuery, 500);

  useEffect(() => {
    setCurrentPage(1);
    fetchUsers(debouncedSearchQuery);
  }, [debouncedSearchQuery]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleFilterChange = (role: UserRole | '') => {
    setRoleFilter(role);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleRoleUpdate = async (email: string, role: UserRole) => {
    await updateUserRole(email, role);
    setUsers((prevUsers) => prevUsers.map((user) => (user.email === email ? { ...user, role } : user)));
  };

  const handleRoleDelete = async (email: string) => {
    await deleteUserRole(email);
    setUsers((prevUsers) => prevUsers.map((user) => (user.email === email ? { ...user, role: 'USER' } : user)));
  };

  const handleUserUpdate = (updatedUser: User) => {
    setUsers((prevUsers) => {
      const exists = prevUsers.some((user) => user.id === updatedUser.id);
      if (exists) {
        return prevUsers.map((user) => (user.id === updatedUser.id ? { ...user, ...updatedUser } : user));
      } else {
        return [...prevUsers, updatedUser];
      }
    });

    setSearchQuery('');
    setRoleFilter('');
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-md relative min-h-[68.5vh]">
      <h1 className="text-2xl font-bold mb-4">{t('admin.pages.roles.title')}</h1>
      <p>{t('admin.pages.roles.addUser')}</p>
      <ol className="list-decimal mb-12 mx-8 mt-4">
        <li>{t('admin.pages.roles.step1')}</li>
        <li>{t('admin.pages.roles.step2')}</li>
        <li>{t('admin.pages.roles.step3')}</li>
      </ol>
      <div className="mb-4 flex gap-4">
        <input
          type="text"
          placeholder={t('admin.pages.roles.searchByEmail')}
          value={searchQuery}
          onChange={handleSearch} // Use the updated handleSearch function
          className="border rounded px-2 py-1"
        />
        <select
          value={roleFilter}
          onChange={(e) => handleFilterChange(e.target.value as UserRole | '')}
          className="border rounded px-2 py-1"
        >
          <option value="">{t('admin.pages.roles.allRoles')}</option>
          <option value="ADMIN">{t('admin.pages.roles.admin')}</option>
          <option value="STAFF">{t('admin.pages.roles.staff')}</option>
          <option value="USER">{t('admin.pages.roles.user')}</option>
        </select>
        <Button
          onClick={() => setShowRegistrationModal(true)}
          variant="default"
          rounded={'full'}
          color="primary"
          size={'xl'}
          className="w-full lg:w-[212px]"
        >
          Crear Usuario/Cliente
        </Button>
      </div>
      <Table>
        <TableHeader>
          <TableRow className="bg-[#3b4da0] h-[62.5px] text-white hover:bg-[#3b4da0]">
            <TableHead className="text-center text-white">{t('admin.columns.fullName')}</TableHead>
            <TableHead className="text-center text-white">{t('admin.columns.email')}</TableHead>
            <TableHead className="text-center text-white">{t('admin.columns.userType')}</TableHead>
            <TableHead className="text-center text-white">{t('admin.columns.city')}</TableHead>
            <TableHead className="text-center text-white">{t('admin.columns.address')}</TableHead>
            <TableHead className="text-center text-white">{t('admin.columns.country')}</TableHead>
            <TableHead className="text-center text-white">{t('admin.columns.phone')}</TableHead>
            <TableHead className="text-center text-white">{t('admin.columns.postalCode')}</TableHead>
            <TableHead className="text-center text-white">{t('admin.columns.province')}</TableHead>
            <TableHead className="text-center text-white">Documento Identidad</TableHead>
            <TableHead className="text-center text-white">{t('admin.columns.contacto')}</TableHead>
            <TableHead className="text-center text-white">{t('admin.columns.role')}</TableHead>
            <TableHead className="text-center text-white">{t('admin.columns.actions')}</TableHead>
            <TableHead className="text-center text-white">{t('admin.columns.editClient')}</TableHead>
            <TableHead className="text-center text-white">{t('admin.columns.createBooking')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tableLoading ? (
            <TableRow>
              <TableCell colSpan={14} className="text-center">
                <LoadingContainer>
                  <LoadingContent />
                </LoadingContainer>
              </TableCell>
            </TableRow>
          ) : (
            users.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="text-center">{user.fullName}</TableCell>
                <TableCell className="text-center">{user.email}</TableCell>
                <TableCell className="text-center">{user.userType}</TableCell>
                <TableCell className="text-center">{user.city}</TableCell>
                <TableCell className="text-center">{user.address}</TableCell>
                <TableCell className="text-center">{user.country}</TableCell>
                <TableCell className="text-center">{user.phone}</TableCell>
                <TableCell className="text-center">{user.postalCode}</TableCell>
                <TableCell className="text-center">{user.province}</TableCell>
                <TableCell className="text-center">{user.docId}</TableCell>
                <TableCell className="text-center">{user.contacto}</TableCell>
                <TableCell className="text-center">{user.role}</TableCell>
                <TableCell className="flex gap-2 justify-center">
                  {user.role !== UserRoles.ADMIN && (
                    <>
                      <Button onClick={() => handleRoleUpdate(user.email, 'ADMIN')} className="bg-red-500 text-white">
                        {t('admin.pages.roles.buttons.adminRole')}
                      </Button>
                      <Button onClick={() => handleRoleUpdate(user.email, 'STAFF')} className="bg-blue-500 text-white">
                        {t('admin.pages.roles.buttons.staffRole')}
                      </Button>
                    </>
                  )}
                  {user.role !== 'USER' && (
                    <Button onClick={() => handleRoleDelete(user.email)} className="bg-gray-500 text-white">
                      {t('admin.pages.roles.buttons.userRole')}
                    </Button>
                  )}
                </TableCell>
                <TableCell className="text-center">
                  <Button
                    onClick={() => {
                      setSelectedUser(user);
                      setShowRegistrationModal(true);
                    }}
                    variant="default"
                    rounded={'full'}
                    color="primary"
                    size={'xl'}
                  >
                    {t('admin.buttons.edit')}
                  </Button>
                </TableCell>
                <TableCell className="text-center">
                  <Button
                    onClick={() => (window.location.href = `/admin/booking/new?userEmail=${user.email}`)}
                    variant="default"
                    rounded={'full'}
                    color="primary"
                    size={'xl'}
                  >
                    {t('admin.columns.createBooking')}
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
      <div className="flex justify-between items-center mt-4">
        <Button
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
          variant="default"
          rounded="full"
          color="primary"
        >
          {t('admin.pagination.previous')}
        </Button>
        <span>
          {t('admin.pagination.page')} {currentPage} {t('admin.pagination.of')} {totalPages}
        </span>
        <Button
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          variant="default"
          rounded="full"
          color="primary"
        >
          {t('admin.pagination.next')}
        </Button>
      </div>
      <RegistrationModal
        open={showRegistrationModal}
        onOpenChange={(isOpen) => {
          if (!isOpen) {
            setSelectedUser(null);
          }
          setShowRegistrationModal(isOpen);
        }}
        defaultUserData={selectedUser}
        disableRequiredFields={true}
        onEditClient={handleUserUpdate}
      />
    </div>
  );
};

export default RolesPage;
