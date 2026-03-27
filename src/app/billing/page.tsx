'use client';

import { useEffect, useState } from 'react';
import { 
  Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Button, Chip, Card, 
  Input, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure, Select, SelectItem, Dropdown, DropdownTrigger, DropdownMenu, DropdownItem 
} from '@heroui/react';
import { 
  IconFileInvoice, IconPlus, IconRefresh, IconCheck, IconTrash, IconDeviceFloppy, IconAlertCircle, IconCash, IconCalendarCancel, IconDotsVertical
} from '@tabler/icons-react';

export default function BillingPage() {
  const [invoices, setInvoices] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [services, setServices] = useState([]); // 🚀 Thêm state lưu danh mục Dịch vụ
  const [loading, setLoading] = useState(true);

  const { isOpen, onOpen, onOpenChange, onClose } = useDisclosure();
  const { isOpen: isDelOpen, onOpen: onDelOpen, onOpenChange: onDelOpenChange, onClose: onDelClose } = useDisclosure();

  // 🚀 Tách totalAmount ra khỏi formData vì giờ nó là số tự tính
  const [formData, setFormData] = useState({ 
      companyId: '', billingMonth: new Date().getMonth() + 1, billingYear: new Date().getFullYear(), 
      invoiceDate: new Date().toISOString().split('T')[0], dueDate: ''
  });
  
  // 🚀 State quản lý danh sách chi tiết dịch vụ
  const [items, setItems] = useState([{ id: Date.now(), serviceId: '', price: 0, quantity: 1, subtotal: 0, description: '' }]);
  
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [errors, setErrors] = useState({ companyId: '', dueDate: '', items: '' });
  const [serverError, setServerError] = useState(""); 
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- FETCH DATA (Hóa đơn, Công ty, Dịch vụ) ---
  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [resInv, resComp, resSvc] = await Promise.all([
        fetch('/api/billing').then(r => r.json()),
        fetch('/api/company').then(r => r.json()),
        fetch('/api/service').then(r => r.json()) // Gọi API lấy giá dịch vụ
      ]);
      setInvoices(resInv.data || []);
      setCompanies(resComp.data || []);
      setServices(resSvc.data || []);
    } catch (error) {
      console.error("Lỗi tải dữ liệu", error);
    }
    setLoading(false);
  };

  useEffect(() => { fetchAllData(); }, []);

  // --- TÍNH TOÁN THỐNG KÊ (DASHBOARD) ---
  const totalUnpaid = invoices.filter((i: any) => i.invoiceStatus === 'ChuaThanhToan').reduce((sum, i: any) => sum + Number(i.totalAmount), 0);
  const totalPaid = invoices.filter((i: any) => i.invoiceStatus === 'DaThanhToan').reduce((sum, i: any) => sum + Number(i.totalAmount), 0);
  const totalOverdue = invoices.filter((i: any) => i.invoiceStatus === 'ChuaThanhToan' && new Date(i.dueDate) < new Date()).length;

  // 🚀 TỰ ĐỘNG TÍNH TỔNG TIỀN TỪ CÁC DÒNG CHI TIẾT
  const autoTotalAmount = items.reduce((sum, item) => sum + item.subtotal, 0);

  // --- QUẢN LÝ DANH SÁCH CHI TIẾT HÓA ĐƠN ---
  const addItem = () => {
      setItems([...items, { id: Date.now(), serviceId: '', price: 0, quantity: 1, subtotal: 0, description: '' }]);
  };

  const removeItem = (id: number) => {
      if (items.length > 1) setItems(items.filter(item => item.id !== id));
  };

  const updateItem = (id: number, field: string, value: any) => {
      setItems(items.map(item => {
          if (item.id === id) {
              const newItem = { ...item, [field]: value };
              // 1. Nếu thay đổi số lượng -> Tính lại Thành tiền
              if (field === 'quantity') {
                  newItem.subtotal = Number(value) * newItem.price;
              }
              // 2. Nếu thay đổi Dịch vụ -> Tự lấy Đơn giá -> Tính lại Thành tiền
              if (field === 'serviceId') {
                  const svc: any = services.find((s: any) => s.serviceId === value);
                  newItem.price = svc ? Number(svc.basePrice) : 0;
                  newItem.subtotal = Number(newItem.quantity) * newItem.price;
              }
              return newItem;
          }
          return item;
      }));
  };

  // --- VALIDATION & XỬ LÝ LƯU ---
  const validateForm = () => {
      let isValid = true;
      let newErrors = { companyId: '', dueDate: '', items: '' };

      if (!formData.companyId) { newErrors.companyId = 'Vui lòng chọn khách hàng'; isValid = false; }
      if (!formData.dueDate) { newErrors.dueDate = 'Vui lòng chọn hạn chót'; isValid = false; }
      if (formData.dueDate && formData.invoiceDate && new Date(formData.dueDate) < new Date(formData.invoiceDate)) {
          newErrors.dueDate = 'Hạn chót không được trước ngày xuất HĐ'; isValid = false;
      }
      
      // Kiểm tra xem đã chọn dịch vụ cho các dòng chi tiết chưa
      const hasEmptyService = items.some(item => !item.serviceId);
      if (hasEmptyService) {
          newErrors.items = 'Vui lòng chọn đầy đủ tên dịch vụ cho các dòng chi tiết'; 
          isValid = false;
      }

      setErrors(newErrors);
      return isValid;
  };

  const handleSave = async () => {
      setServerError("");
      if (!validateForm()) return; 

      setIsSubmitting(true);
      try {
          // 🚀 Gom dữ liệu Master và Detail lại thành 1 gói
          const payload = { ...formData, items }; 
          
          const res = await fetch('/api/billing', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload)
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

  const updateStatus = async (invoiceId: string, status: string) => {
      await fetch('/api/billing', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ invoiceId, invoiceStatus: status })
      });
      fetchAllData();
  };

  const confirmDelete = (id: string) => { setDeleteId(id); onDelOpen(); };
  const executeDelete = async () => {
      await fetch(`/api/billing?id=${deleteId}`, { method: 'DELETE' });
      fetchAllData();
      onDelClose();
  };

  const openModal = () => {
      setErrors({ companyId: '', dueDate: '', items: '' });
      setServerError("");
      
      const today = new Date();
      const nextWeek = new Date(today);
      nextWeek.setDate(nextWeek.getDate() + 7);

      setFormData({ 
          companyId: '', billingMonth: today.getMonth() + 1, billingYear: today.getFullYear(), 
          invoiceDate: today.toISOString().split('T')[0], 
          dueDate: nextWeek.toISOString().split('T')[0]
      });
      // Reset danh sách dịch vụ về 1 dòng trống
      setItems([{ id: Date.now(), serviceId: '', price: 0, quantity: 1, subtotal: 0, description: '' }]);
      onOpen();
  };

  const getStatusDisplay = (status: string, dueDate: string) => {
      if (status === 'DaThanhToan') return { label: 'Đã thanh toán', color: 'success' as const };
      if (status === 'DaHuy') return { label: 'Đã hủy', color: 'default' as const };
      if (new Date(dueDate) < new Date()) return { label: 'Quá hạn', color: 'danger' as const };
      return { label: 'Chờ thanh toán', color: 'warning' as const };
  };

  return (
    <div className="p-6 space-y-6">
      {/* HEADER */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <IconFileInvoice className="text-blue-600" /> Quản lý Hóa Đơn
          </h1>
          <p className="text-sm text-neutral-500 italic">Theo dõi công nợ và phát hành hóa đơn dịch vụ</p>
        </div>
        <div className="flex gap-2">
          <Button isIconOnly variant="flat" onPress={fetchAllData}><IconRefresh size={18}/></Button>
          <Button color="primary" className="font-bold shadow-md" startContent={<IconPlus size={18}/>} onPress={openModal}>Tạo Hóa Đơn</Button>
        </div>
      </div>

      {/* DASHBOARD THỐNG KÊ */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-none shadow-sm bg-warning-50 p-5 border-l-4 border-warning-500">
            <div className="flex justify-between items-start">
                <div>
                    <p className="text-xs font-bold text-warning-700 uppercase">Công nợ cần thu</p>
                    <p className="text-2xl font-black text-warning-900 mt-1">{totalUnpaid.toLocaleString()} đ</p>
                </div>
                <div className="p-2 bg-warning-100 rounded-lg text-warning-600"><IconCash /></div>
            </div>
        </Card>
        <Card className="border-none shadow-sm bg-success-50 p-5 border-l-4 border-success-500">
            <div className="flex justify-between items-start">
                <div>
                    <p className="text-xs font-bold text-success-700 uppercase">Đã thu (Tháng này)</p>
                    <p className="text-2xl font-black text-success-900 mt-1">{totalPaid.toLocaleString()} đ</p>
                </div>
                <div className="p-2 bg-success-100 rounded-lg text-success-600"><IconCheck /></div>
            </div>
        </Card>
        <Card className="border-none shadow-sm bg-danger-50 p-5 border-l-4 border-danger-500">
            <div className="flex justify-between items-start">
                <div>
                    <p className="text-xs font-bold text-danger-700 uppercase">Hóa đơn quá hạn</p>
                    <p className="text-2xl font-black text-danger-900 mt-1">{totalOverdue} HĐ</p>
                </div>
                <div className="p-2 bg-danger-100 rounded-lg text-danger-600"><IconCalendarCancel /></div>
            </div>
        </Card>
      </div>

      {/* BẢNG DỮ LIỆU */}
      <Table aria-label="Invoice Table" shadow="none" className="border border-neutral-200 rounded-xl">
        <TableHeader>
          <TableColumn>MÃ HĐ / KỲ CƯỚC</TableColumn>
          <TableColumn>KHÁCH HÀNG (CÔNG TY)</TableColumn>
          <TableColumn>NGÀY XUẤT - HẠN CHÓT</TableColumn>
          <TableColumn align="end">TỔNG TIỀN</TableColumn>
          <TableColumn>TRẠNG THÁI</TableColumn>
          <TableColumn align="center">HÀNH ĐỘNG</TableColumn>
        </TableHeader>
        <TableBody loadingContent={"Đang tải dữ liệu..."} isLoading={loading} emptyContent={"Chưa có hóa đơn nào."}>
          {invoices.map((inv: any) => {
            const statusInfo = getStatusDisplay(inv.invoiceStatus, inv.dueDate);
            return (
            <TableRow key={inv.invoiceId}>
              <TableCell>
                  <div className="flex flex-col">
                      <span className="font-mono text-xs font-bold text-blue-600">{inv.invoiceId}</span>
                      <span className="text-[10px] text-neutral-500">Kỳ: {inv.billingMonth}/{inv.billingYear}</span>
                  </div>
              </TableCell>
              <TableCell>
                  <div className="flex flex-col">
                      <span className="font-bold text-neutral-800">{inv.companyName || '---'}</span>
                  </div>
              </TableCell>
              <TableCell>
                <div className="flex flex-col text-xs font-medium">
                  <span className="text-neutral-600">Xuất: {new Date(inv.invoiceDate).toLocaleDateString('vi-VN')}</span>
                  <span className={statusInfo.color === 'danger' ? 'text-danger-600 font-bold' : 'text-neutral-500'}>
                      Hạn: {new Date(inv.dueDate).toLocaleDateString('vi-VN')}
                  </span>
                </div>
              </TableCell>
              <TableCell>
                  <div className="text-right font-black text-lg text-neutral-800">
                      {Number(inv.totalAmount || 0).toLocaleString()} <span className="text-xs text-neutral-400 font-normal">đ</span>
                  </div>
              </TableCell>
              <TableCell>
                <Chip size="sm" variant="flat" color={statusInfo.color} className="font-semibold">
                  {statusInfo.label}
                </Chip>
              </TableCell>
              <TableCell>
                <div className="flex justify-center">
                    <Dropdown placement="bottom-end">
                        <DropdownTrigger>
                            <Button isIconOnly size="sm" variant="light"><IconDotsVertical size={18} className="text-neutral-500"/></Button>
                        </DropdownTrigger>
                        <DropdownMenu aria-label="Thao tác hóa đơn">
                            <DropdownItem key="pay" color="success" className="text-success-600" startContent={<IconCheck size={16}/>} onPress={() => updateStatus(inv.invoiceId, 'DaThanhToan')}>
                                Xác nhận Đã Thu Tiền
                            </DropdownItem>
                            <DropdownItem key="cancel" color="warning" startContent={<IconAlertCircle size={16}/>} onPress={() => updateStatus(inv.invoiceId, 'DaHuy')}>
                                Hủy hóa đơn
                            </DropdownItem>
                            <DropdownItem key="delete" color="danger" className="text-danger-600" startContent={<IconTrash size={16}/>} onPress={() => confirmDelete(inv.invoiceId)}>
                                Xóa vĩnh viễn
                            </DropdownItem>
                        </DropdownMenu>
                    </Dropdown>
                </div>
              </TableCell>
            </TableRow>
          )})}
        </TableBody>
      </Table>

      {/* MODAL TẠO HÓA ĐƠN CHI TIẾT */}
      <Modal isOpen={isOpen} onOpenChange={onOpenChange} backdrop="blur" size="3xl" scrollBehavior="inside">
          <ModalContent>
              {(onClose) => (
                  <>
                      <ModalHeader className="font-bold text-blue-700 border-b border-neutral-100">Phát hành Hóa đơn mới</ModalHeader>
                      <ModalBody className="space-y-4 pt-4">
                          {serverError && (
                              <div className="flex items-start gap-2 p-3 bg-danger-50 border border-danger-200 rounded-xl text-danger-600 text-sm">
                                  <IconAlertCircle size={18} className="mt-0.5 flex-shrink-0" />
                                  <p>{serverError}</p>
                              </div>
                          )}
                          
                          <Select 
                              label="Khách hàng nhận hóa đơn (*)" 
                              isInvalid={!!errors.companyId} errorMessage={errors.companyId}
                              selectedKeys={formData.companyId ? [formData.companyId] : []}
                              onChange={(e) => setFormData({...formData, companyId: e.target.value})}
                          >
                              {companies.map((c: any) => (
                                  <SelectItem key={c.companyId} textValue={c.companyName}>
                                      <div className="flex flex-col">
                                        <span className="font-bold">{c.companyName}</span>
                                        <span className="text-tiny text-neutral-500">Mã KH: {c.companyId}</span>
                                      </div>
                                  </SelectItem>
                              ))}
                          </Select>

                          <div className="flex gap-4">
                              <Input label="Kỳ cước (Tháng)" type="number" min={1} max={12} value={formData.billingMonth.toString()} onChange={e => setFormData({...formData, billingMonth: parseInt(e.target.value)})} className="w-1/4" />
                              <Input label="Năm" type="number" value={formData.billingYear.toString()} onChange={e => setFormData({...formData, billingYear: parseInt(e.target.value)})} className="w-1/4" />
                              <Input type="date" label="Ngày xuất HĐ (*)" value={formData.invoiceDate} onChange={e => setFormData({...formData, invoiceDate: e.target.value})} className="w-1/4" />
                              <Input type="date" label="Hạn chót (*)" value={formData.dueDate} isInvalid={!!errors.dueDate} errorMessage={errors.dueDate} onChange={e => setFormData({...formData, dueDate: e.target.value})} className="w-1/4" />
                          </div>

                          {/* 🚀 KHU VỰC THÊM CHI TIẾT DỊCH VỤ ĐỘNG */}
                          <div className="border border-neutral-200 rounded-xl p-4 bg-white mt-4">
                              <div className="flex justify-between items-center mb-4">
                                  <div>
                                    <p className="font-bold text-sm text-neutral-800">Chi tiết dịch vụ sử dụng</p>
                                    {errors.items && <p className="text-xs text-danger-500 mt-1">{errors.items}</p>}
                                  </div>
                                  <Button size="sm" variant="flat" color="primary" onPress={addItem} startContent={<IconPlus size={14}/>}>Thêm dịch vụ</Button>
                              </div>
                              
                              <div className="space-y-3">
                                  {items.map((item, index) => (
                                      <div key={item.id} className="flex gap-2 items-start bg-neutral-50/50 p-2 rounded-lg border border-neutral-100">
                                          <Select 
                                              label={`Dịch vụ ${index + 1} (*)`} size="sm" className="w-[35%]"
                                              selectedKeys={item.serviceId ? [item.serviceId] : []}
                                              onChange={(e) => updateItem(item.id, 'serviceId', e.target.value)}
                                          >
                                              {services.map((s: any) => (
                                                  <SelectItem key={s.serviceId} textValue={s.serviceName}>
                                                      <div className="flex flex-col">
                                                          <span>{s.serviceName}</span>
                                                          <span className="text-tiny text-neutral-400">{Number(s.basePrice).toLocaleString()}đ / {s.unitMeasurement}</span>
                                                      </div>
                                                  </SelectItem>
                                              ))}
                                          </Select>
                                          
                                          <Input label="Số lượng" type="number" size="sm" className="w-[15%]" value={item.quantity.toString()} onChange={e => updateItem(item.id, 'quantity', e.target.value)} />
                                          <Input label="Đơn giá" size="sm" className="w-[20%]" value={item.price.toLocaleString()} isDisabled />
                                          <Input label="Thành tiền" size="sm" className="w-[25%] font-bold text-blue-600" value={item.subtotal.toLocaleString()} isDisabled />
                                          
                                          <Button isIconOnly size="sm" color="danger" variant="light" className="mt-1" onPress={() => removeItem(item.id)}><IconTrash size={18}/></Button>
                                      </div>
                                  ))}
                              </div>
                              
                              <div className="flex justify-end pt-4 mt-2 border-t border-dashed border-neutral-200">
                                  <div className="text-right">
                                      <p className="text-sm text-neutral-500 font-medium mb-1">Tổng tiền thanh toán</p>
                                      <p className="text-3xl font-black text-blue-600">{autoTotalAmount.toLocaleString()} <span className="text-sm font-normal text-neutral-500">VNĐ</span></p>
                                  </div>
                              </div>
                          </div>
                      </ModalBody>
                      <ModalFooter>
                          <Button variant="flat" onPress={onClose} isDisabled={isSubmitting}>Hủy bỏ</Button>
                          <Button color="primary" className="font-bold shadow-md" onPress={handleSave} isLoading={isSubmitting} startContent={!isSubmitting && <IconDeviceFloppy size={18}/>}>
                              {isSubmitting ? "Đang xử lý..." : "Lưu & Phát hành HĐ"}
                          </Button>
                      </ModalFooter>
                  </>
              )}
          </ModalContent>
      </Modal>

      {/* MODAL XÓA */}
      <Modal isOpen={isDelOpen} onOpenChange={onDelOpenChange} size="xs" backdrop="blur">
          <ModalContent>
              <ModalHeader className="text-danger">⚠️ Xác nhận Xóa Hóa Đơn</ModalHeader>
              <ModalBody><p className="text-sm font-medium text-center">Xóa hóa đơn này sẽ ảnh hưởng đến báo cáo công nợ. Bạn có chắc chắn?</p></ModalBody>
              <ModalFooter>
                  <Button variant="light" onPress={onDelClose}>Hủy</Button>
                  <Button color="danger" variant="shadow" onPress={executeDelete}>Xóa vĩnh viễn</Button>
              </ModalFooter>
          </ModalContent>
      </Modal>
    </div>
  );
}