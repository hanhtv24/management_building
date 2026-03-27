'use client';

import { useEffect, useState } from 'react';
import { 
  Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Button, Chip, Card, 
  Input, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure, Select, SelectItem,
  Tabs, Tab, Accordion, AccordionItem
} from '@heroui/react';
import { IconHistory, IconReportMoney, IconPlus, IconTrash, IconDeviceFloppy, IconAlertCircle, IconReceipt2 } from '@tabler/icons-react';

export default function UsageReportPage() {
  const [logs, setLogs] = useState([]);
  const [reportData, setReportData] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  // Lọc theo tháng năm
  const [filterMonth, setFilterMonth] = useState((new Date().getMonth() + 1).toString());
  const [filterYear, setFilterYear] = useState(new Date().getFullYear().toString());

  // --- QUẢN LÝ MODAL ---
  const { isOpen, onOpen, onOpenChange, onClose } = useDisclosure();
  const { isOpen: isDelOpen, onOpen: onDelOpen, onOpenChange: onDelOpenChange, onClose: onDelClose } = useDisclosure();
  
  // 🚀 ĐỂ TRỐNG USAGE START ĐỂ TRÁNH LỖI HYDRATION TỪ NEXT.JS
  const [formData, setFormData] = useState({ 
      consumerId: '', serviceId: '', usageStart: '', 
      usageEnd: '', unitPriceSnapshot: '' 
  });
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [serverError, setServerError] = useState(""); 
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- FETCH DATA ---
  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [resUsage, resComp, resSvc] = await Promise.all([
        fetch(`/api/usage?month=${filterMonth}&year=${filterYear}`).then(r => r.json()),
        fetch('/api/company').then(r => r.json()),
        fetch('/api/service').then(r => r.json())
      ]);
      setLogs(resUsage.logs || []);
      setReportData(resUsage.reportData || []);
      setCompanies(resComp.data || []);
      setServices(resSvc.data || []);
    } catch (error) {
      console.error("Lỗi tải dữ liệu", error);
    }
    setLoading(false);
  };

  useEffect(() => { fetchAllData(); }, [filterMonth, filterYear]);

  // 🚀 HÀM MỞ MODAL THÔNG MINH (Tự động lấy giờ hiện tại + reset form)
  const handleOpenModal = () => {
      setFormData({
          consumerId: '',
          serviceId: '',
          usageStart: new Date().toLocaleString('sv-SE').replace(' ', 'T').slice(0, 16),
          usageEnd: '',
          unitPriceSnapshot: ''
      });
      setServerError("");
      onOpen();
  };

  // --- HÀM LƯU NHẬT KÝ ---
  const handleSave = async () => {
      setServerError("");
      if (!formData.consumerId || !formData.serviceId || !formData.usageStart || !formData.unitPriceSnapshot) {
          setServerError("Vui lòng nhập đủ các trường bắt buộc (*)"); return;
      }
      setIsSubmitting(true);
      try {
          const res = await fetch('/api/usage', {
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

  // --- HÀM XỬ LÝ XÓA ---
  const confirmDelete = (log: any) => {
      setDeleteTarget(log);
      onDelOpen();
  };

  const executeDelete = async () => {
      if (!deleteTarget) return;
      await fetch(`/api/usage?serviceId=${deleteTarget.serviceId}&consumerId=${deleteTarget.consumerId}&usageStart=${deleteTarget.usageStart}`, { 
          method: 'DELETE' 
      });
      fetchAllData();
      onDelClose();
  };

  return (
    <div className="p-6 space-y-6">
      {/* HEADER */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2 text-indigo-700">
            <IconHistory /> Nhật ký Sử dụng & Báo cáo
          </h1>
          <p className="text-sm text-neutral-500">Ghi nhận dịch vụ và tổng hợp chi phí hàng tháng của Công ty</p>
        </div>
        <div className="flex gap-2">
            <Select size="sm" className="w-24" label="Tháng" selectedKeys={[filterMonth]} onChange={e => setFilterMonth(e.target.value)}>
                {[...Array(12)].map((_, i) => <SelectItem key={(i+1).toString()} textValue={`Tháng ${i+1}`}>Tháng {i+1}</SelectItem>)}
            </Select>
            <Input size="sm" className="w-24" label="Năm" type="number" value={filterYear} onChange={e => setFilterYear(e.target.value)} />
        </div>
      </div>

      <Tabs aria-label="Options" color="primary" variant="underlined" classNames={{ tabList: "gap-6 w-full relative rounded-none p-0 border-b border-divider" }}>
        
        <Tab key="logs" title={<div className="flex items-center gap-2"><IconPlus size={18}/> Nhập liệu Dịch vụ</div>}>
            <div className="mt-4 flex justify-end mb-4">
                {/* 🚀 THAY ĐỔI ONPRESS Ở ĐÂY */}
                <Button color="primary" onPress={handleOpenModal} startContent={<IconPlus size={16}/>}>Thêm bản ghi mới</Button>
            </div>
            <Table aria-label="Usage Logs" shadow="none" className="border border-neutral-200 rounded-xl">
                <TableHeader>
                    <TableColumn>THỜI GIAN</TableColumn>
                    <TableColumn>CÔNG TY SỬ DỤNG</TableColumn>
                    <TableColumn>DỊCH VỤ</TableColumn>
                    <TableColumn align="end">CHI PHÍ (VNĐ)</TableColumn>
                    <TableColumn align="center">HÀNH ĐỘNG</TableColumn>
                </TableHeader>
                <TableBody isLoading={loading} emptyContent="Tháng này chưa có ghi nhận nào.">
                    {logs.map((log: any, idx: number) => (
                        <TableRow key={idx}>
                            <TableCell className="font-medium text-xs">
                                <span className="text-blue-600">{new Date(log.usageStart).toLocaleString('vi-VN')}</span>
                                {log.usageEnd && <><br/><span className="text-neutral-400">đến {new Date(log.usageEnd).toLocaleString('vi-VN')}</span></>}
                            </TableCell>
                            <TableCell className="font-bold">{log.companyName}</TableCell>
                            <TableCell>
                                <Chip size="sm" variant="flat" color={log.serviceType === 'Cố định' ? 'primary' : 'warning'}>{log.serviceName}</Chip>
                            </TableCell>
                            <TableCell className="text-right font-bold text-danger-600">{Number(log.unitPriceSnapshot).toLocaleString()} đ</TableCell>
                            <TableCell>
                                <div className="flex justify-center">
                                  <Button isIconOnly size="sm" color="danger" variant="light" onPress={() => confirmDelete(log)}>
                                    <IconTrash size={16}/>
                                  </Button>
                                </div>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </Tab>

        <Tab key="reports" title={<div className="flex items-center gap-2"><IconReportMoney size={18}/> Báo cáo Chi phí Tháng {filterMonth}</div>}>
            <div className="mt-4">
                <Accordion variant="splitted">
                    {reportData.map((report: any) => (
                        <AccordionItem 
                            key={report.companyId} 
                            aria-label={report.companyName}
                            title={<span className="font-bold text-lg">{report.companyName}</span>}
                            subtitle={`Tổng phí: ${report.grandTotal.toLocaleString()} đ`}
                            startContent={<div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg"><IconReceipt2/></div>}
                        >
                            <div className="p-4 bg-neutral-50 rounded-xl space-y-4">
                                <div className="flex justify-between items-center border-b border-dashed border-neutral-300 pb-2">
                                    <div>
                                        <p className="font-bold text-indigo-700">1. Chi phí thuê mặt bằng</p>
                                        <p className="text-xs text-neutral-500 italic">Cách tính: Diện tích x Đơn giá ({report.rentDetail})</p>
                                    </div>
                                    <p className="font-black text-lg">{report.rentTotal.toLocaleString()} VNĐ</p>
                                </div>

                                <div>
                                    <div className="flex justify-between items-center mb-2">
                                        <p className="font-bold text-orange-600">2. Tổng tiền dịch vụ phát sinh</p>
                                        <p className="font-black text-lg">{report.servicesTotal.toLocaleString()} VNĐ</p>
                                    </div>
                                    <Table aria-label="Details" removeWrapper className="bg-white rounded-lg border border-neutral-200">
                                        <TableHeader>
                                            <TableColumn>THỜI GIAN SỬ DỤNG</TableColumn>
                                            <TableColumn>TÊN DỊCH VỤ</TableColumn>
                                            <TableColumn align="end">GIÁ TIỀN (LẦN NÀY)</TableColumn>
                                        </TableHeader>
                                        <TableBody emptyContent="Không sử dụng dịch vụ ngoài trong tháng này.">
                                            {report.serviceDetails.map((detail: any, i: number) => (
                                                <TableRow key={i}>
                                                    <TableCell className="text-xs">{new Date(detail.date).toLocaleString('vi-VN')}</TableCell>
                                                    <TableCell><Chip size="sm" variant="flat">{detail.serviceName}</Chip></TableCell>
                                                    <TableCell className="text-right font-medium">{detail.cost.toLocaleString()} đ</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            </div>
                        </AccordionItem>
                    ))}
                </Accordion>
            </div>
        </Tab>
      </Tabs>

      {/* MODAL THÊM NHẬT KÝ */}
      <Modal isOpen={isOpen} onOpenChange={onOpenChange} backdrop="blur">
          <ModalContent>
              {(onClose) => (
                  <>
                      <ModalHeader className="font-bold text-indigo-700">Ghi nhận sử dụng Dịch vụ</ModalHeader>
                      <ModalBody className="space-y-4">
                          {serverError && (
                              <div className="flex items-start gap-2 p-3 bg-danger-50 border border-danger-200 rounded-xl text-danger-600 text-sm">
                                  <IconAlertCircle size={18} className="mt-0.5 flex-shrink-0" /> <p>{serverError}</p>
                              </div>
                          )}
                          
                          <Select 
                            label="Công ty sử dụng (*)" 
                            placeholder="Chọn công ty"
                            selectedKeys={formData.consumerId ? [formData.consumerId] : []} 
                            onChange={(e) => setFormData({...formData, consumerId: e.target.value})}
                          >
                              {companies.map((c: any) => (
                                <SelectItem key={c.companyId} textValue={c.companyName}>
                                    {c.companyName}
                                </SelectItem>
                              ))}
                          </Select>

                          <Select 
                              label="Dịch vụ sử dụng (*)" 
                              placeholder="Chọn dịch vụ"
                              selectedKeys={formData.serviceId ? [formData.serviceId] : []} 
                              onChange={(e) => {
                                  const val = e.target.value;
                                  if (!val) return;
                                  const svc: any = services.find((s:any) => s.serviceId === val);
                                  setFormData({...formData, serviceId: val, unitPriceSnapshot: svc ? svc.basePrice : ''});
                              }}
                          >
                              {services.map((s: any) => (
                                <SelectItem key={s.serviceId} textValue={s.serviceName}>
                                    <div className="flex justify-between w-full">
                                        <span>{s.serviceName}</span>
                                        <span className="text-tiny text-neutral-400">{Number(s.basePrice).toLocaleString()}đ</span>
                                    </div>
                                </SelectItem>
                              ))}
                          </Select>

                          <Input type="datetime-local" label="Thời gian bắt đầu (*)" value={formData.usageStart} onChange={e => setFormData({...formData, usageStart: e.target.value})} />
                          <Input label="Giá tiền tính toán (VNĐ) (*)" type="number" value={formData.unitPriceSnapshot} onChange={e => setFormData({...formData, unitPriceSnapshot: e.target.value})} />
                      </ModalBody>
                      <ModalFooter>
                          <Button variant="flat" onPress={onClose}>Hủy bỏ</Button>
                          <Button color="primary" onPress={handleSave} isLoading={isSubmitting} startContent={!isSubmitting && <IconDeviceFloppy size={18}/>}>
                              Lưu nhật ký
                          </Button>
                      </ModalFooter>
                  </>
              )}
          </ModalContent>
      </Modal>

      {/* MODAL XÁC NHẬN XÓA XỊN SÒ */}
      <Modal isOpen={isDelOpen} onOpenChange={onDelOpenChange} size="xs" backdrop="blur">
          <ModalContent>
              {(onClose) => (
                  <>
                      <ModalHeader className="flex flex-col gap-1 text-danger">⚠️ Xác nhận xóa</ModalHeader>
                      <ModalBody>
                          <p className="text-sm font-medium">Bạn có chắc muốn xóa nhật ký này không? Hành động này không thể hoàn tác.</p>
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