'use client';

import { useEffect, useState } from 'react';
import {
  Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Chip, Button,
  Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure, Input, Select, SelectItem
} from '@heroui/react';
import { IconContract, IconPlus, IconRefresh, IconEdit, IconTrash, IconDeviceFloppy, IconAlertCircle } from '@tabler/icons-react';

export default function ContractPage() {
  const [contracts, setContracts] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [offices, setOffices] = useState([]);
  const [loading, setLoading] = useState(true);

  // --- QUẢN LÝ MODAL ---
  const { isOpen, onOpen, onOpenChange, onClose } = useDisclosure();
  const { isOpen: isDelOpen, onOpen: onDelOpen, onOpenChange: onDelOpenChange, onClose: onDelClose } = useDisclosure();

  const [formData, setFormData] = useState({ companyId: '', officeId: '', startDate: '', endDate: '', rentPrice: '', status: 'HieuLuc' });
  const [deleteKeys, setDeleteKeys] = useState({ companyId: '', officeId: '', startDate: '' });

  const [errors, setErrors] = useState({ companyId: '', officeId: '', startDate: '', rentPrice: '', endDate: '' });
  const [serverError, setServerError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- FETCH DATA (Hợp đồng, Công ty, Văn phòng) ---
  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [resCont, resComp, resOff] = await Promise.all([
        fetch('/api/contract').then(r => r.json()),
        fetch('/api/company').then(r => r.json()),
        fetch('/api/office').then(r => r.json())
      ]);
      setContracts(resCont.data || []);
      setCompanies(resComp.data || []);
      setOffices(resOff.data || []);
    } catch (error) {
      console.error("Lỗi tải dữ liệu", error);
    }
    setLoading(false);
  };

  useEffect(() => { fetchAllData(); }, []);

  // --- VALIDATION & XỬ LÝ LƯU ---
  const validateForm = () => {
    let isValid = true;
    let newErrors = { companyId: '', officeId: '', startDate: '', rentPrice: '', endDate: '' };

    if (!formData.companyId) { newErrors.companyId = 'Vui lòng chọn công ty'; isValid = false; }
    if (!formData.officeId) { newErrors.officeId = 'Vui lòng chọn văn phòng'; isValid = false; }
    if (!formData.startDate) { newErrors.startDate = 'Bắt buộc'; isValid = false; }
    if (!formData.rentPrice || Number(formData.rentPrice) <= 0) { newErrors.rentPrice = 'Giá thuê không hợp lệ'; isValid = false; }

    if (formData.endDate && formData.startDate && new Date(formData.endDate) <= new Date(formData.startDate)) {
      newErrors.endDate = 'Ngày hết hạn phải lớn hơn ngày ký'; isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSave = async () => {
    setServerError("");
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/contract', {
        method: 'POST', // Khóa phức hợp hơi khó PUT, thường ta tạo mới hoặc hủy
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const result = await res.json();

      if (result.success) {
        fetchAllData();
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

  const confirmDelete = (contract: any) => {
    setDeleteKeys({ companyId: contract.companyId, officeId: contract.officeId, startDate: contract.startDate });
    onDelOpen();
  };

  const executeDelete = async () => {
    await fetch(`/api/contract?companyId=${deleteKeys.companyId}&officeId=${deleteKeys.officeId}&startDate=${deleteKeys.startDate}`, {
      method: 'DELETE'
    });
    fetchAllData();
    onDelClose();
  };

  const openModal = () => {
    setErrors({ companyId: '', officeId: '', startDate: '', rentPrice: '', endDate: '' });
    setServerError("");
    setFormData({ companyId: '', officeId: '', startDate: new Date().toISOString().split('T')[0], endDate: '', rentPrice: '', status: 'HieuLuc' });
    onOpen();
  };

  const getStatusColor = (status: string) => {
    if (status === 'HieuLuc') return 'success';
    if (status === 'HetHan') return 'warning';
    return 'danger';
  };

  const getStatusText = (status: string) => {
    if (status === 'HieuLuc') return 'Đang hiệu lực';
    if (status === 'HetHan') return 'Đã hết hạn';
    if (status === 'DaHuy') return 'Đã hủy';
    return status || 'Đang hiệu lực';
  };

  return (
    <div className="p-6 space-y-6">
      {/* HEADER */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <IconContract className="text-orange-500" /> Quản lý Hợp đồng
          </h2>
          <p className="text-sm text-neutral-500 italic">Theo dõi thời hạn và giá trị thuê mặt bằng</p>
        </div>
        <div className="flex gap-2">
          <Button isIconOnly variant="flat" onPress={fetchAllData}><IconRefresh size={18} /></Button>
          <Button color="warning" className="text-white font-bold" startContent={<IconPlus size={18} />} onPress={openModal}>Ký Hợp Đồng</Button>
        </div>
      </div>

      {/* BẢNG DỮ LIỆU */}
      <Table aria-label="Contract Table" shadow="none" className="border border-neutral-200 rounded-xl">
        <TableHeader>
          <TableColumn>CÔNG TY THUÊ</TableColumn>
          <TableColumn>VĂN PHÒNG</TableColumn>
          <TableColumn>NGÀY KÝ - HẾT HẠN</TableColumn>
          <TableColumn>GIÁ THUÊ/THÁNG</TableColumn>
          <TableColumn>TRẠNG THÁI</TableColumn>
          <TableColumn align="center">HÀNH ĐỘNG</TableColumn>
        </TableHeader>
        <TableBody loadingContent={"Đang tải hợp đồng..."} isLoading={loading} emptyContent="Chưa có hợp đồng nào.">
          {contracts.map((ct: any) => (
            <TableRow key={ct.contractId}>
              <TableCell>
                <div className="flex flex-col">
                  <span className="font-bold text-orange-600">{ct.companyName || 'Công ty không xác định'}</span>
                  <span className="text-[10px] text-neutral-400 font-mono">ID: {ct.companyId}</span>
                </div>
              </TableCell>
              <TableCell className="font-bold">Phòng {ct.officeId}</TableCell>
              <TableCell>
                <div className="flex flex-col text-xs font-medium">
                  <span className="text-green-600">Bắt đầu: {new Date(ct.startDate).toLocaleDateString('vi-VN')}</span>
                  <span className="text-danger-500">Kết thúc: {ct.endDate ? new Date(ct.endDate).toLocaleDateString('vi-VN') : 'Không thời hạn'}</span>
                </div>
              </TableCell>
              <TableCell className="font-bold text-neutral-700">
                {Number(ct.rentPrice).toLocaleString()} đ
              </TableCell>
              <TableCell>
                <Chip size="sm" color={getStatusColor(ct.status)} variant="flat">{getStatusText(ct.status)}</Chip>
              </TableCell>
              <TableCell>
                <Button isIconOnly size="sm" color="danger" variant="light" onPress={() => confirmDelete(ct)}><IconTrash size={16} /></Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* MODAL THÊM HỢP ĐỒNG */}
      <Modal isOpen={isOpen} onOpenChange={onOpenChange} backdrop="blur" size="2xl">
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="font-bold text-orange-600">Ký hợp đồng thuê mới</ModalHeader>
              <ModalBody className="space-y-4">
                {serverError && (
                  <div className="flex items-start gap-2 p-3 bg-danger-50 border border-danger-200 rounded-xl text-danger-600 text-sm">
                    <IconAlertCircle size={18} className="mt-0.5 flex-shrink-0" />
                    <p>{serverError}</p>
                  </div>
                )}

                <div className="flex gap-4">
                  {/* SELECT CÔNG TY */}
                  <Select
                    label="Chọn Khách hàng (Công ty) (*)"
                    className="w-1/2"
                    isInvalid={!!errors.companyId} errorMessage={errors.companyId}
                    selectedKeys={formData.companyId ? [formData.companyId] : []}
                    onChange={(e) => setFormData({ ...formData, companyId: e.target.value })}
                  >
                    {companies.map((c: any) => (
                      // 🚀 CHỈ CẦN KEY VÀ TEXTVALUE, KHÔNG DÙNG VALUE NỮA
                      <SelectItem key={c.companyId} textValue={c.companyName}>
                        <div className="flex flex-col">
                          <span className="font-bold">{c.companyName}</span>
                          <span className="text-tiny text-neutral-500">{c.companyId}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </Select>

                  {/* SELECT VĂN PHÒNG */}
                  <Select
                    label="Chọn Văn phòng (*)"
                    className="w-1/2"
                    isInvalid={!!errors.officeId} errorMessage={errors.officeId}
                    selectedKeys={formData.officeId ? [formData.officeId] : []}
                    onChange={(e) => {
                      const selectedOffice: any = offices.find((o: any) => o.officeId === e.target.value);
                      setFormData({ ...formData, officeId: e.target.value, rentPrice: selectedOffice ? selectedOffice.unitPrice : '' });
                    }}
                  >
                    {offices.map((o: any) => (
                      // 🚀 TƯƠNG TỰ, BỎ THUỘC TÍNH VALUE ĐI
                      <SelectItem key={o.officeId} textValue={`Phòng ${o.officeId}`}>
                        <div className="flex justify-between w-full items-center">
                          <span className="font-bold">Phòng {o.officeId}</span>
                          <span className="text-tiny text-neutral-500">{o.area}m² - {Number(o.unitPrice).toLocaleString()}đ</span>
                        </div>
                      </SelectItem>
                    ))}
                  </Select>
                </div>

                <div className="flex gap-4">
                  <Input type="date" label="Ngày ký (*)" value={formData.startDate} isInvalid={!!errors.startDate} errorMessage={errors.startDate} onChange={e => setFormData({ ...formData, startDate: e.target.value })} className="w-1/2" />
                  <Input type="date" label="Ngày hết hạn" placeholder="Để trống nếu vô thời hạn" value={formData.endDate} isInvalid={!!errors.endDate} errorMessage={errors.endDate} onChange={e => setFormData({ ...formData, endDate: e.target.value })} className="w-1/2" />
                </div>

                <Input label="Giá thuê thống nhất (VNĐ/Tháng) (*)" type="number" value={formData.rentPrice} isInvalid={!!errors.rentPrice} errorMessage={errors.rentPrice} onChange={e => setFormData({ ...formData, rentPrice: e.target.value })} />

              </ModalBody>
              <ModalFooter>
                <Button variant="flat" onPress={onClose} isDisabled={isSubmitting}>Hủy</Button>
                <Button color="warning" className="text-white font-bold" onPress={handleSave} isLoading={isSubmitting} startContent={!isSubmitting && <IconDeviceFloppy size={18} />}>
                  {isSubmitting ? "Đang xử lý..." : "Ký Hợp Đồng"}
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      {/* MODAL XÓA */}
      <Modal isOpen={isDelOpen} onOpenChange={onDelOpenChange} size="xs" backdrop="blur">
        <ModalContent>
          <ModalHeader className="text-danger">⚠️ Hủy Hợp Đồng</ModalHeader>
          <ModalBody><p className="text-sm font-medium text-center">Bạn có chắc chắn muốn hủy bỏ hợp đồng này?</p></ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={onDelClose}>Đóng</Button>
            <Button color="danger" variant="shadow" onPress={executeDelete}>Đồng ý hủy</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}