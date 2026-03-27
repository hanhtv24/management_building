'use client';

import { useEffect, useState } from 'react';
import { 
  Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Button, Chip, 
  Input, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure, Select, SelectItem
} from '@heroui/react';
import { IconUserCode, IconPlus, IconAlertCircle, IconPercentage, IconDeviceFloppy, IconTrash } from '@tabler/icons-react';

export default function WorkAssignmentPage() {
  const [assignments, setAssignments] = useState([]);
  const [staffs, setStaffs] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  const [filterMonth, setFilterMonth] = useState((new Date().getMonth() + 1).toString());
  const [filterYear, setFilterYear] = useState(new Date().getFullYear().toString());

  // 🚀 Quản lý Modal Thêm mới và Modal Xóa
  const { isOpen, onOpen, onOpenChange, onClose } = useDisclosure();
  const { isOpen: isDelOpen, onOpen: onDelOpen, onOpenChange: onDelOpenChange, onClose: onDelClose } = useDisclosure();
  
  const [formData, setFormData] = useState({ 
      staffId: '', serviceId: '', month: filterMonth, year: filterYear, position: '', revenueRateShare: '' 
  });
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [serverError, setServerError] = useState(""); 
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [resAssn, resStaff, resSvc] = await Promise.all([
        fetch(`/api/assignment?month=${filterMonth}&year=${filterYear}`).then(r => r.json()),
        fetch('/api/staff').then(r => r.json()),
        fetch('/api/service').then(r => r.json())
      ]);
      setAssignments(resAssn.data || []);
      setStaffs(resStaff.data || []);
      setServices(resSvc.data || []);
    } catch (error) {
      console.error("Lỗi tải dữ liệu", error);
    }
    setLoading(false);
  };

  useEffect(() => { fetchAllData(); }, [filterMonth, filterYear]);

  const totalBaseSalary = assignments?.reduce((sum, item: any) => sum + Number(item.baseSalary || 0), 0) || 0;

  const handleOpenModal = () => {
      setFormData({ staffId: '', serviceId: '', month: filterMonth, year: filterYear, position: '', revenueRateShare: '' });
      setServerError("");
      onOpen();
  };

  const handleSave = async () => {
      setServerError("");
      if (!formData.staffId || !formData.serviceId || !formData.position || !formData.revenueRateShare) {
          setServerError("Vui lòng nhập đủ các trường (*)"); return;
      }
      setIsSubmitting(true);
      try {
          const res = await fetch('/api/assignment', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(formData)
          });
          const result = await res.json();
          if (result.success) {
              fetchAllData();
              onClose();
          } else setServerError(result.message); 
      } catch (error) { setServerError("Lỗi mạng."); } 
      finally { setIsSubmitting(false); }
  };

  // 🚀 XÓA XỊN SÒ (Không dùng Confirm đen xì nữa)
  const confirmDelete = (item: any) => {
      setDeleteTarget(item);
      onDelOpen();
  };

  const executeDelete = async () => {
      if (!deleteTarget) return;
      await fetch(`/api/assignment?staffId=${deleteTarget.staffId}&serviceId=${deleteTarget.serviceId}&month=${filterMonth}&year=${filterYear}`, { 
          method: 'DELETE' 
      });
      fetchAllData();
      onDelClose();
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2 text-indigo-700">
            <IconUserCode /> Phân công & Tỉ lệ doanh thu
          </h1>
          <p className="text-sm text-neutral-500">Quản lý vị trí làm việc và % hoa hồng theo từng tháng</p>
        </div>
        <div className="flex gap-2 items-center">
            <div className="mr-6 text-right">
                <p className="text-xs font-bold text-neutral-500 uppercase">Tổng lương cứng</p>
                <p className="text-xl font-black text-danger-600">{totalBaseSalary.toLocaleString()} đ</p>
            </div>
            <Select size="sm" className="w-24" label="Tháng" selectedKeys={[filterMonth]} onChange={e => setFilterMonth(e.target.value)}>
                {[...Array(12)].map((_, i) => <SelectItem key={(i+1).toString()} textValue={`Tháng ${i+1}`}>Tháng {i+1}</SelectItem>)}
            </Select>
            <Input size="sm" className="w-24" label="Năm" type="number" value={filterYear} onChange={e => setFilterYear(e.target.value)} />
            <Button color="primary" className="ml-2" onPress={handleOpenModal} startContent={<IconPlus size={16}/>}>Phân công</Button>
        </div>
      </div>

      <Table aria-label="Assignment Table" shadow="none" className="border border-neutral-200 rounded-xl">
        <TableHeader>
          <TableColumn>NHÂN VIÊN</TableColumn>
          <TableColumn>DỊCH VỤ PHỤ TRÁCH</TableColumn>
          <TableColumn>VỊ TRÍ (POSITION)</TableColumn>
          <TableColumn align="end">LƯƠNG CƠ BẢN</TableColumn>
          <TableColumn align="center">% DOANH THU</TableColumn>
          <TableColumn align="center">HÀNH ĐỘNG</TableColumn>
        </TableHeader>
        <TableBody isLoading={loading} emptyContent={`Không có dữ liệu phân công trong Tháng ${filterMonth}/${filterYear}.`}>
          {assignments?.map((item: any, idx: number) => (
            <TableRow key={idx}>
              <TableCell className="font-bold text-neutral-800">{item.staffName || 'N/A'}</TableCell>
              <TableCell><Chip size="sm" variant="flat" color="primary">{item.serviceName || 'N/A'}</Chip></TableCell>
              <TableCell><span className="font-mono bg-neutral-100 px-2 py-1 rounded">{item.position}</span></TableCell>
              <TableCell className="text-right font-medium">{Number(item.baseSalary).toLocaleString()} đ</TableCell>
              <TableCell className="text-center font-bold text-success-600">{Number(item.revenueRateShare)} %</TableCell>
              <TableCell>
                  <div className="flex justify-center">
                    <Button isIconOnly size="sm" color="danger" variant="light" onPress={() => confirmDelete(item)}>
                      <IconTrash size={16}/>
                    </Button>
                  </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* MODAL THÊM PHÂN CÔNG */}
      <Modal isOpen={isOpen} onOpenChange={onOpenChange} backdrop="blur">
          <ModalContent>
              {(onClose) => (
                  <>
                      <ModalHeader className="font-bold text-indigo-700">Phân công vị trí làm việc</ModalHeader>
                      <ModalBody className="space-y-4">
                          {serverError && (
                              <div className="flex items-start gap-2 p-3 bg-danger-50 border border-danger-200 rounded-xl text-danger-600 text-sm">
                                  <IconAlertCircle size={18} className="mt-0.5 flex-shrink-0" /> <p>{serverError}</p>
                              </div>
                          )}
                          
                          <div className="flex gap-4">
                              <Input label="Tháng" value={formData.month} isDisabled className="w-1/2" />
                              <Input label="Năm" value={formData.year} isDisabled className="w-1/2" />
                          </div>

                          <Select label="Chọn Nhân viên (*)" selectedKeys={formData.staffId ? [formData.staffId] : []} onChange={(e) => setFormData({...formData, staffId: e.target.value})}>
                              {staffs?.map((s: any) => <SelectItem key={s.staffId || s.id} textValue={s.fullName || s.name}>{s.fullName || s.name}</SelectItem>)}
                          </Select>

                          <Select label="Dịch vụ phụ trách (*)" selectedKeys={formData.serviceId ? [formData.serviceId] : []} onChange={(e) => setFormData({...formData, serviceId: e.target.value})}>
                              {services?.map((s: any) => <SelectItem key={s.serviceId || s.id} textValue={s.serviceName}>{s.serviceName}</SelectItem>)}
                          </Select>

                          <Input label="Vị trí (Ví dụ: Giám sát, Kỹ thuật...) (*)" value={formData.position} onChange={e => setFormData({...formData, position: e.target.value})} />
                          
                          <Input label="Tỉ lệ chia sẻ doanh thu (%) (*)" type="number" step="0.01" startContent={<IconPercentage size={18} className="text-neutral-400"/>} value={formData.revenueRateShare} onChange={e => setFormData({...formData, revenueRateShare: e.target.value})} />
                      </ModalBody>
                      <ModalFooter>
                          <Button variant="flat" onPress={onClose}>Hủy</Button>
                          <Button color="primary" onPress={handleSave} isLoading={isSubmitting} startContent={!isSubmitting && <IconDeviceFloppy size={18}/>}>
                              Lưu phân công
                          </Button>
                      </ModalFooter>
                  </>
              )}
          </ModalContent>
      </Modal>

      {/* 🚀 MODAL XÁC NHẬN XÓA XỊN SÒ */}
      <Modal isOpen={isDelOpen} onOpenChange={onDelOpenChange} size="xs" backdrop="blur">
          <ModalContent>
              {(onClose) => (
                  <>
                      <ModalHeader className="flex flex-col gap-1 text-danger">⚠️ Xác nhận hủy phân công</ModalHeader>
                      <ModalBody>
                          <p className="text-sm font-medium">Bạn có chắc muốn hủy phân công này không? Hành động này không thể hoàn tác.</p>
                      </ModalBody>
                      <ModalFooter>
                          <Button variant="light" onPress={onClose}>Hủy</Button>
                          <Button color="danger" variant="shadow" onPress={executeDelete}>Đồng ý xóa</Button>
                      </ModalFooter>
                  </>
              )}
          </ModalContent>
      </Modal>
    </div>
  );
}