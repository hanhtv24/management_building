'use client';

import { useEffect, useState } from 'react';
import { 
  Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, User, Chip, Button,
  Input, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure 
} from '@heroui/react';
import { 
  IconUserCheck, IconBriefcase, IconEdit, IconTrash, IconDeviceFloppy, IconAlertCircle 
} from '@tabler/icons-react';

export default function StaffPage() {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);

  // --- CÁC STATE PHỤC VỤ TÍNH NĂNG CRUD ---
  const { isOpen, onOpen, onOpenChange, onClose } = useDisclosure();
  const { isOpen: isDelOpen, onOpen: onDelOpen, onOpenChange: onDelOpenChange, onClose: onDelClose } = useDisclosure();

  const [formData, setFormData] = useState({ 
      staffId: '', fullName: '', dob: '', gender: '', phone: '', role: '', baseSalary: '' 
  });
  const [isEdit, setIsEdit] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const [errors, setErrors] = useState({ staffId: '', fullName: '', phone: '', dob: '', gender: '', baseSalary: '' });
  const [serverError, setServerError] = useState(""); 
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- HÀM GỌI DỮ LIỆU ---
  const fetchStaff = () => {
    setLoading(true);
    fetch('/api/staff')
      .then(res => res.json())
      .then(data => {
        setStaff(data.data || []);
        setLoading(false);
      });
  };

  useEffect(() => { fetchStaff(); }, []);

  // --- HÀM VALIDATE VÀ XỬ LÝ DỮ LIỆU ---
  const validateForm = () => {
      let isValid = true;
      let newErrors = { staffId: '', fullName: '', phone: '', dob: '', gender: '', baseSalary: '' };

      if (!formData.staffId.trim()) { newErrors.staffId = 'Bắt buộc'; isValid = false; }
      if (!formData.fullName.trim()) { newErrors.fullName = 'Bắt buộc'; isValid = false; }
      if (!formData.dob) { newErrors.dob = 'Bắt buộc'; isValid = false; }
      if (!formData.gender) { newErrors.gender = 'Bắt buộc'; isValid = false; }
      if (!formData.baseSalary) { newErrors.baseSalary = 'Bắt buộc'; isValid = false; }

      const phoneRegex = /^(0[3|5|7|8|9])+([0-9]{8})$/;
      if (!formData.phone.trim()) {
          newErrors.phone = 'Bắt buộc'; isValid = false;
      } else if (!phoneRegex.test(formData.phone.trim())) {
          newErrors.phone = 'SĐT không hợp lệ'; isValid = false;
      }

      setErrors(newErrors);
      return isValid;
  };

  const handleSave = async () => {
      setServerError("");
      if (!validateForm()) return; 

      setIsSubmitting(true);
      const method = isEdit ? 'PUT' : 'POST';
      
      try {
          const res = await fetch('/api/staff', {
              method,
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(formData)
          });
          const result = await res.json();

          if (result.success) {
              fetchStaff();
              onClose();
          } else {
              setServerError(result.message); 
          }
      } catch (error) {
          setServerError("Mất kết nối đến máy chủ.");
      } finally {
          setIsSubmitting(false);
      }
  };

  const confirmDelete = (id: string) => { setDeleteId(id); onDelOpen(); };
  
  const executeDelete = async () => {
      await fetch(`/api/staff?id=${deleteId}`, { method: 'DELETE' });
      fetchStaff();
      onDelClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => { if (e.key === 'Enter') handleSave(); };

  const openModal = (item?: any) => {
      setErrors({ staffId: '', fullName: '', phone: '', dob: '', gender: '', baseSalary: '' });
      setServerError("");
      if (item) {
          setFormData({
              ...item,
              phone: Array.isArray(item.phone) ? item.phone[0] : item.phone,
              role: Array.isArray(item.role) ? item.role[0] : item.role
          });
          setIsEdit(true);
      } else {
          setFormData({ staffId: '', fullName: '', dob: '', gender: '', phone: '', role: '', baseSalary: '' });
          setIsEdit(false);
      }
      onOpen();
  };

  return (
    <div className="p-4 space-y-6">
      {/* HEADER BẢNG - GIỮ NGUYÊN THIẾT KẾ CỦA BẠN */}
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <IconUserCheck className="text-green-600" /> Đội ngũ Nhân viên
          </h2>
          <p className="text-sm text-neutral-500">Quản lý nhân sự vận hành tòa nhà</p>
        </div>
        <Button color="success" className="text-white font-bold" variant="shadow" onPress={() => openModal()}>
            Thêm nhân viên
        </Button>
      </div>

      <Table aria-label="Staff Table" shadow="none" className="border border-neutral-200 rounded-xl">
        <TableHeader>
          <TableColumn>NHÂN VIÊN</TableColumn>
          <TableColumn>CHỨC VỤ</TableColumn>
          <TableColumn>LIÊN HỆ</TableColumn>
          <TableColumn>MỨC LƯƠNG</TableColumn>
          <TableColumn>TRẠNG THÁI</TableColumn>
          <TableColumn align="center">THAO TÁC</TableColumn>
        </TableHeader>
        <TableBody emptyContent={"Chưa có dữ liệu nhân sự."} loadingContent={"Đang tải danh sách..."} isLoading={loading}>
          {staff.map((employee: any) => {
            // Lấy giá trị chuỗi từ mảng (vì Schema quy định phone và role là array)
            const phoneStr = Array.isArray(employee.phone) ? employee.phone[0] : employee.phone;
            const roleStr = Array.isArray(employee.role) ? employee.role[0] : employee.role;

            return (
            <TableRow key={employee.staffId}>
              <TableCell>
                <User
                  name={<span className="font-bold">{employee.fullName}</span>}
                  description={employee.staffId}
                  avatarProps={{ name: employee.fullName, color: "success", isBordered: true, size: "sm" }}
                />
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1">
                  <IconBriefcase size={14} className="text-neutral-400" />
                  <span className="text-sm">{roleStr || 'Nhân viên'}</span>
                </div>
              </TableCell>
              <TableCell>
                <div className="text-xs text-neutral-500">
                  <p>{phoneStr}</p>
                  <p>{employee.gender}</p> {/* Mình thay email thành gender vì schema chưa có cột email */}
                </div>
              </TableCell>
              <TableCell className="font-semibold text-neutral-700">
                {Number(employee.baseSalary || 0).toLocaleString()} đ
              </TableCell>
              <TableCell>
                <Chip size="sm" color="success" variant="dot">Đang làm việc</Chip>
              </TableCell>
              <TableCell>
                <div className="flex justify-center gap-2">
                    <Button isIconOnly size="sm" variant="light" color="primary" onPress={() => openModal(employee)}>
                        <IconEdit size={18}/>
                    </Button>
                    <Button isIconOnly size="sm" variant="light" color="danger" onPress={() => confirmDelete(employee.staffId)}>
                        <IconTrash size={18}/>
                    </Button>
                </div>
              </TableCell>
            </TableRow>
          )})}
        </TableBody>
      </Table>

      {/* MODAL THÊM / SỬA NHÂN VIÊN */}
      <Modal isOpen={isOpen} onOpenChange={onOpenChange} backdrop="blur" size="2xl">
          <ModalContent>
              {(onClose) => (
                  <>
                      <ModalHeader className="font-bold text-green-700">{isEdit ? "Cập nhật hồ sơ" : "Thêm nhân viên mới"}</ModalHeader>
                      <ModalBody className="space-y-4">
                          {serverError && (
                              <div className="flex items-start gap-2 p-3 bg-danger-50 border border-danger-200 rounded-xl text-danger-600 text-sm">
                                  <IconAlertCircle size={18} className="mt-0.5 flex-shrink-0" />
                                  <p>{serverError}</p>
                              </div>
                          )}
                          <div className="flex gap-4">
                              <Input label="Mã NV (*)" isDisabled={isEdit} value={formData.staffId} isInvalid={!!errors.staffId} errorMessage={errors.staffId} onChange={e => { setFormData({...formData, staffId: e.target.value}); setServerError(""); }} onKeyDown={handleKeyDown} className="w-1/3" />
                              <Input label="Họ và tên (*)" value={formData.fullName} isInvalid={!!errors.fullName} errorMessage={errors.fullName} onChange={e => { setFormData({...formData, fullName: e.target.value}); setServerError(""); }} onKeyDown={handleKeyDown} className="w-2/3" />
                          </div>

                          <div className="flex gap-4">
                              <Input type="date" label="Ngày sinh (*)" placeholder=" " value={formData.dob} isInvalid={!!errors.dob} errorMessage={errors.dob} onChange={e => { setFormData({...formData, dob: e.target.value}); setServerError(""); }} onKeyDown={handleKeyDown} className="w-1/2" />
                              <Input label="Giới tính (*)" placeholder="Nam / Nu" value={formData.gender} isInvalid={!!errors.gender} errorMessage={errors.gender} onChange={e => { setFormData({...formData, gender: e.target.value}); setServerError(""); }} onKeyDown={handleKeyDown} className="w-1/2" />
                          </div>

                          <div className="flex gap-4">
                              <Input label="Số điện thoại (*)" value={formData.phone} isInvalid={!!errors.phone} errorMessage={errors.phone} onChange={e => { setFormData({...formData, phone: e.target.value}); setServerError(""); }} onKeyDown={handleKeyDown} className="w-1/2" />
                              <Input label="Lương cơ bản (VNĐ) (*)" type="number" value={formData.baseSalary} isInvalid={!!errors.baseSalary} errorMessage={errors.baseSalary} onChange={e => { setFormData({...formData, baseSalary: e.target.value}); setServerError(""); }} onKeyDown={handleKeyDown} className="w-1/2" />
                          </div>

                          <Input label="Chức vụ (Role)" placeholder="VD: QuanLy, NhanVien, BaoVe" value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})} onKeyDown={handleKeyDown} />
                          
                      </ModalBody>
                      <ModalFooter>
                          <Button variant="flat" onPress={onClose} isDisabled={isSubmitting}>Hủy bỏ</Button>
                          <Button color="success" className="text-white" onPress={handleSave} isLoading={isSubmitting} startContent={!isSubmitting && <IconDeviceFloppy size={18}/>}>
                              {isSubmitting ? "Đang lưu..." : "Lưu hồ sơ"}
                          </Button>
                      </ModalFooter>
                  </>
              )}
          </ModalContent>
      </Modal>

      {/* MODAL XÁC NHẬN XÓA */}
      <Modal isOpen={isDelOpen} onOpenChange={onDelOpenChange} size="xs" backdrop="blur">
          <ModalContent>
              <ModalHeader className="text-danger">⚠️ Xác nhận nghỉ việc</ModalHeader>
              <ModalBody><p className="text-sm font-medium text-center">Bạn có chắc chắn muốn xóa hồ sơ nhân viên này?</p></ModalBody>
              <ModalFooter>
                  <Button variant="light" onPress={onDelClose}>Hủy</Button>
                  <Button color="danger" variant="shadow" onPress={executeDelete}>Đồng ý xóa</Button>
              </ModalFooter>
          </ModalContent>
      </Modal>
    </div>
  );
}