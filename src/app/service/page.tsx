'use client';

import { useEffect, useState } from 'react';
import { 
  Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Button, Chip, Card, 
  Input, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure 
} from '@heroui/react';
import { IconTools, IconPlus, IconRefresh, IconEdit, IconTrash, IconDeviceFloppy, IconAlertCircle } from '@tabler/icons-react';

export default function ServicePricePage() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  // --- QUẢN LÝ MODAL VÀ TRẠNG THÁI ---
  const { isOpen, onOpen, onOpenChange, onClose } = useDisclosure();
  const { isOpen: isDelOpen, onOpen: onDelOpen, onOpenChange: onDelOpenChange, onClose: onDelClose } = useDisclosure();

  const [formData, setFormData] = useState({ 
      serviceId: '', serviceName: '', serviceType: '', unitMeasurement: '', basePrice: '' 
  });
  const [isEdit, setIsEdit] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const [errors, setErrors] = useState({ serviceId: '', serviceName: '', basePrice: '', unitMeasurement: '' });
  const [serverError, setServerError] = useState(""); 
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- HÀM TẢI DỮ LIỆU ---
  const fetchServices = () => {
    setLoading(true);
    fetch('/api/service')
      .then(res => res.json())
      .then(data => {
        setServices(data.data || []);
        setLoading(false);
      });
  };

  useEffect(() => { fetchServices(); }, []);

  // 🚀 TÍNH TOÁN DỮ LIỆU THỐNG KÊ ĐỘNG (REAL-TIME)
  // Phân loại dựa trên text người dùng nhập vào ô "Loại dịch vụ"
  const fixedServicesCount = services.filter((s: any) => /cố định|codinh|cốđịnh/i.test(s.serviceType || '')).length;
  const variableServicesCount = services.filter((s: any) => /biến đổi|biendoi|phát sinh|chỉ số/i.test(s.serviceType || '')).length;
  const parkingServicesCount = services.filter((s: any) => /gửi xe|guixe|xe/i.test(s.serviceType || '')).length;

  // --- VALIDATION & XỬ LÝ LƯU ---
  const validateForm = () => {
      let isValid = true;
      let newErrors = { serviceId: '', serviceName: '', basePrice: '', unitMeasurement: '' };

      if (!formData.serviceId.trim()) { newErrors.serviceId = 'Bắt buộc'; isValid = false; }
      if (!formData.serviceName.trim()) { newErrors.serviceName = 'Bắt buộc'; isValid = false; }
      if (!formData.unitMeasurement.trim()) { newErrors.unitMeasurement = 'Bắt buộc'; isValid = false; }
      if (!formData.basePrice || Number(formData.basePrice) < 0) { 
          newErrors.basePrice = 'Đơn giá không hợp lệ'; isValid = false; 
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
          const res = await fetch('/api/service', {
              method,
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(formData)
          });
          const result = await res.json();

          if (result.success) {
              fetchServices();
              onClose();
          } else {
              setServerError(result.message); 
          }
      } catch (error) {
          setServerError("Mất kết nối máy chủ.");
      } finally {
          setIsSubmitting(false);
      }
  };

  const confirmDelete = (id: string) => { setDeleteId(id); onDelOpen(); };
  const executeDelete = async () => {
      await fetch(`/api/service?id=${deleteId}`, { method: 'DELETE' });
      fetchServices();
      onDelClose();
  };

  const openModal = (item?: any) => {
      setErrors({ serviceId: '', serviceName: '', basePrice: '', unitMeasurement: '' });
      setServerError("");
      if (item) {
          setFormData(item);
          setIsEdit(true);
      } else {
          // Gợi ý sẵn một vài giá trị để người dùng đỡ phải gõ nhiều
          setFormData({ serviceId: '', serviceName: '', serviceType: 'Cố định', unitMeasurement: 'Tháng', basePrice: '0' });
          setIsEdit(false);
      }
      onOpen();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => { if (e.key === 'Enter') handleSave(); };

  // 🚀 HÀM TỰ ĐỘNG NHẬN DIỆN MÀU SẮC CHO CHIP
  const getTypeDisplay = (type: string) => {
      const t = (type || '').toLowerCase();
      if (t.includes('cố định') || t.includes('codinh')) return { label: 'Cố định', color: 'primary' as const };
      if (t.includes('biến đổi') || t.includes('biendoi')) return { label: 'Biến đổi', color: 'warning' as const };
      if (t.includes('xe')) return { label: 'Gửi xe', color: 'secondary' as const };
      return { label: type || 'Khác', color: 'default' as const };
  };

  return (
    <div className="p-6 space-y-6">
      {/* HEADER */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <IconTools className="text-purple-600" /> Danh mục Dịch vụ & Bảng giá
          </h1>
          <p className="text-sm text-neutral-500 italic">Cấu hình đơn giá làm căn cứ tính hóa đơn hàng tháng</p>
        </div>
        <div className="flex gap-2">
          <Button isIconOnly variant="flat" onPress={fetchServices}><IconRefresh size={18}/></Button>
          <Button color="secondary" startContent={<IconPlus size={18}/>} onPress={() => openModal()}>Thêm dịch vụ</Button>
        </div>
      </div>

      {/* 🚀 TÓM TẮT THỐNG KÊ ĐỘNG (REAL-TIME) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-none shadow-sm bg-purple-50 p-4">
            <p className="text-xs font-bold text-purple-600 uppercase">Dịch vụ cố định</p>
            {/* padStart(2, '0') giúp số 1 hiển thị thành 01 cho đẹp */}
            <p className="text-2xl font-black">{fixedServicesCount.toString().padStart(2, '0')}</p>
            <p className="text-[10px] text-neutral-400">Vệ sinh, Bảo vệ, Rác, Thang máy</p>
        </Card>
        <Card className="border-none shadow-sm bg-blue-50 p-4">
            <p className="text-xs font-bold text-blue-600 uppercase">Dịch vụ biến đổi</p>
            <p className="text-2xl font-black">{variableServicesCount.toString().padStart(2, '0')}</p>
            <p className="text-[10px] text-neutral-400">Điện, Nước (Tính theo chỉ số)</p>
        </Card>
        <Card className="border-none shadow-sm bg-orange-50 p-4">
            <p className="text-xs font-bold text-orange-600 uppercase">Phí gửi xe</p>
            <p className="text-2xl font-black">{parkingServicesCount.toString().padStart(2, '0')}</p>
            <p className="text-[10px] text-neutral-400">Ô tô, Xe máy</p>
        </Card>
      </div>

      {/* BẢNG DỮ LIỆU */}
      <Table aria-label="Service Table" shadow="none" className="border border-neutral-200 rounded-xl">
        <TableHeader>
          <TableColumn>MÃ DỊCH VỤ</TableColumn>
          <TableColumn>TÊN DỊCH VỤ</TableColumn>
          <TableColumn>LOẠI DỊCH VỤ</TableColumn>
          <TableColumn>ĐƠN GIÁ (CƠ BẢN)</TableColumn>
          <TableColumn>ĐƠN VỊ TÍNH</TableColumn>
          <TableColumn align="center">HÀNH ĐỘNG</TableColumn>
        </TableHeader>
        <TableBody loadingContent={"Đang tải bảng giá..."} isLoading={loading} emptyContent={"Chưa có cấu hình dịch vụ nào."}>
          {services.map((s: any) => {
            const typeInfo = getTypeDisplay(s.serviceType);
            return (
            <TableRow key={s.serviceId}>
              <TableCell className="font-mono text-xs text-neutral-500 font-bold">{s.serviceId}</TableCell>
              <TableCell className="font-bold">{s.serviceName}</TableCell>
              <TableCell>
                <Chip size="sm" variant="dot" color={typeInfo.color}>
                  {typeInfo.label}
                </Chip>
              </TableCell>
              <TableCell className="font-bold text-purple-600">
                {Number(s.basePrice || 0).toLocaleString()} đ
              </TableCell>
              <TableCell className="text-xs text-neutral-500 uppercase italic">
                {s.unitMeasurement || '---'}
              </TableCell>
              <TableCell>
                <div className="flex gap-2">
                    <Button size="sm" color="secondary" variant="flat" onPress={() => openModal(s)}><IconEdit size={16}/> Sửa</Button>
                    <Button isIconOnly size="sm" color="danger" variant="light" onPress={() => confirmDelete(s.serviceId)}><IconTrash size={16}/></Button>
                </div>
              </TableCell>
            </TableRow>
          )})}
        </TableBody>
      </Table>

      {/* MODAL THÊM / SỬA */}
      <Modal isOpen={isOpen} onOpenChange={onOpenChange} backdrop="blur" size="lg">
          <ModalContent>
              {(onClose) => (
                  <>
                      <ModalHeader className="font-bold text-purple-700">{isEdit ? "Cập nhật dịch vụ" : "Tạo dịch vụ mới"}</ModalHeader>
                      <ModalBody className="space-y-4">
                          {serverError && (
                              <div className="flex items-start gap-2 p-3 bg-danger-50 border border-danger-200 rounded-xl text-danger-600 text-sm">
                                  <IconAlertCircle size={18} className="mt-0.5 flex-shrink-0" />
                                  <p>{serverError}</p>
                              </div>
                          )}
                          <div className="flex gap-4">
                              <Input label="Mã DV (*)" isDisabled={isEdit} value={formData.serviceId} isInvalid={!!errors.serviceId} errorMessage={errors.serviceId} onChange={e => { setFormData({...formData, serviceId: e.target.value}); setServerError(""); }} onKeyDown={handleKeyDown} className="w-1/3" />
                              <Input label="Tên dịch vụ (*)" placeholder="VD: Điện sinh hoạt" value={formData.serviceName} isInvalid={!!errors.serviceName} errorMessage={errors.serviceName} onChange={e => { setFormData({...formData, serviceName: e.target.value}); setServerError(""); }} onKeyDown={handleKeyDown} className="w-2/3" />
                          </div>

                          <Input label="Loại dịch vụ" placeholder="Gợi ý: Cố định / Biến đổi / Gửi xe" value={formData.serviceType} onChange={e => setFormData({...formData, serviceType: e.target.value})} onKeyDown={handleKeyDown} />

                          <div className="flex gap-4">
                              <Input label="Đơn giá (VNĐ) (*)" type="number" value={formData.basePrice} isInvalid={!!errors.basePrice} errorMessage={errors.basePrice} onChange={e => { setFormData({...formData, basePrice: e.target.value}); setServerError(""); }} onKeyDown={handleKeyDown} className="w-2/3" />
                              <Input label="Đơn vị tính (*)" placeholder="VD: kWh, m3, chiếc, tháng" value={formData.unitMeasurement} isInvalid={!!errors.unitMeasurement} errorMessage={errors.unitMeasurement} onChange={e => { setFormData({...formData, unitMeasurement: e.target.value}); setServerError(""); }} onKeyDown={handleKeyDown} className="w-1/3" />
                          </div>
                      </ModalBody>
                      <ModalFooter>
                          <Button variant="flat" onPress={onClose} isDisabled={isSubmitting}>Hủy</Button>
                          <Button color="secondary" onPress={handleSave} isLoading={isSubmitting} startContent={!isSubmitting && <IconDeviceFloppy size={18}/>}>
                              {isSubmitting ? "Đang lưu..." : "Lưu giá (Enter)"}
                          </Button>
                      </ModalFooter>
                  </>
              )}
          </ModalContent>
      </Modal>

      {/* MODAL XÓA */}
      <Modal isOpen={isDelOpen} onOpenChange={onDelOpenChange} size="xs" backdrop="blur">
          <ModalContent>
              <ModalHeader className="text-danger">⚠️ Xác nhận xóa</ModalHeader>
              <ModalBody><p className="text-sm font-medium text-center">Bạn có chắc chắn muốn xóa dịch vụ này?</p></ModalBody>
              <ModalFooter>
                  <Button variant="light" onPress={onDelClose}>Hủy</Button>
                  <Button color="danger" variant="shadow" onPress={executeDelete}>Xóa</Button>
              </ModalFooter>
          </ModalContent>
      </Modal>
    </div>
  );
}