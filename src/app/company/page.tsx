'use client';

import { useEffect, useState } from 'react';
import {
    Table, TableHeader, TableColumn, TableBody, TableRow, TableCell,
    Button, Input, Chip, Card, CardBody, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure
} from '@heroui/react';
import { IconPlus, IconSearch, IconBuildings, IconPhone, IconMail, IconTrash, IconEdit, IconDeviceFloppy, IconAlertCircle } from '@tabler/icons-react';

export default function CompanyPage() {
    const [companies, setCompanies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterValue, setFilterValue] = useState("");

    const { isOpen, onOpen, onOpenChange, onClose } = useDisclosure();
    const { isOpen: isDelOpen, onOpen: onDelOpen, onOpenChange: onDelOpenChange, onClose: onDelClose } = useDisclosure();

    const [formData, setFormData] = useState({
        consumerId: '', companyId: '', companyName: '', taxCode: '', phoneNo: '', email: ''
    });
    const [isEdit, setIsEdit] = useState(false);
    const [deleteId, setDeleteId] = useState<string | null>(null);

    const [errors, setErrors] = useState({ companyId: '', companyName: '', phoneNo: '', email: '' });

    // 🚀 STATE MỚI ĐỂ HIỂN THỊ LỖI TỪ SERVER LÊN GIAO DIỆN
    const [serverError, setServerError] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false); // Trạng thái nút Lưu

    const fetchCompanies = () => {
        setLoading(true);
        fetch('/api/company').then(res => res.json()).then(data => {
            setCompanies(data.data || []);
            setLoading(false);
        });
    };

    useEffect(() => { fetchCompanies(); }, []);

    const filteredItems = companies.filter((item: any) =>
        item.companyName?.toLowerCase().includes(filterValue.toLowerCase()) ||
        item.companyId?.toLowerCase().includes(filterValue.toLowerCase())
    );

    const validateForm = () => {
        let isValid = true;
        let newErrors = { companyId: '', companyName: '', phoneNo: '', email: '' };

        if (!formData.companyId.trim()) { newErrors.companyId = 'Vui lòng nhập mã công ty'; isValid = false; }
        if (!formData.companyName.trim()) { newErrors.companyName = 'Vui lòng nhập tên'; isValid = false; }

        const phoneRegex = /^(0[3|5|7|8|9])+([0-9]{8})$/;
        if (!formData.phoneNo.trim()) {
            newErrors.phoneNo = 'Vui lòng nhập SĐT'; isValid = false;
        } else if (!phoneRegex.test(formData.phoneNo.trim())) {
            newErrors.phoneNo = 'SĐT không hợp lệ (10 số)'; isValid = false;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (formData.email.trim() && !emailRegex.test(formData.email.trim())) {
            newErrors.email = 'Email không hợp lệ'; isValid = false;
        }

        setErrors(newErrors);
        return isValid;
    };

    const handleSave = async () => {
        setServerError(""); // Xóa lỗi cũ trước khi submit
        if (!validateForm()) return;

        setIsSubmitting(true);
        const method = isEdit ? 'PUT' : 'POST';

        try {
            const res = await fetch('/api/company', {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            const result = await res.json();

            if (result.success) {
                fetchCompanies();
                onClose();
            } else {
                // HIỂN THỊ LỖI LÊN UI THAY VÌ DÙNG ALERT
                setServerError(result.message);
            }
        } catch (error) {
            setServerError("Mất kết nối đến máy chủ. Vui lòng thử lại sau.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const confirmDelete = (id: string) => { setDeleteId(id); onDelOpen(); };
    const executeDelete = async () => {
        await fetch(`/api/company?id=${deleteId}`, { method: 'DELETE' });
        fetchCompanies();
        onDelClose();
    };

    const handleKeyDown = (e: React.KeyboardEvent) => { if (e.key === 'Enter') handleSave(); };

    const openModal = (item?: any) => {
        setErrors({ companyId: '', companyName: '', phoneNo: '', email: '' });
        setServerError(""); // Reset lỗi server khi mở form
        if (item) {
            setFormData({ ...item, phoneNo: Array.isArray(item.phoneNo) ? item.phoneNo[0] : item.phoneNo });
            setIsEdit(true);
        } else {
            setFormData({ consumerId: '', companyId: '', companyName: '', taxCode: '', phoneNo: '', email: '' });
            setIsEdit(false);
        }
        onOpen();
    };

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold uppercase text-blue-600 flex items-center gap-2">
                    <IconBuildings /> Khách hàng doanh nghiệp
                </h1>
                <Button color="primary" onPress={() => openModal()} startContent={<IconPlus size={18} />}>Thêm Công Ty</Button>
            </div>

            <Card className="border-none shadow-sm bg-neutral-50">
                <CardBody>
                    <Input
                        isClearable
                        className="w-full max-w-md"
                        placeholder="Tìm theo tên hoặc mã công ty..."
                        startContent={<IconSearch size={18} />}
                        value={filterValue}
                        onValueChange={setFilterValue}
                    />
                </CardBody>
            </Card>

            <Table aria-label="Company Table" shadow="none" className="border border-neutral-200 rounded-xl">
                {/* ... (Phần Table giữ nguyên) ... */}
                <TableHeader>
                    <TableColumn>MÃ CÔNG TY</TableColumn>
                    <TableColumn>TÊN DOANH NGHIỆP</TableColumn>
                    <TableColumn>LIÊN HỆ</TableColumn>
                    <TableColumn>DIỆN TÍCH THUÊ</TableColumn>
                    <TableColumn align="center">THAO TÁC</TableColumn>
                </TableHeader>
                <TableBody isLoading={loading} emptyContent={"Không tìm thấy công ty nào."}>
                    {filteredItems.map((company: any) => (
                        <TableRow key={company.consumerId}>
                            <TableCell className="font-mono text-xs">{company.companyId}</TableCell>
                            <TableCell>
                                <div className="flex flex-col">
                                    <span className="font-bold text-blue-700">{company.companyName}</span>
                                    <span className="text-[10px] text-neutral-400 font-mono">ID: {company.consumerId}</span>
                                </div>
                            </TableCell>
                            <TableCell>
                                <div className="text-xs">
                                    <div className="flex items-center gap-1 font-medium"><IconPhone size={12} /> {company.phoneNo}</div>
                                    <div className="flex items-center gap-1 text-neutral-500"><IconMail size={12} /> {company.email}</div>
                                </div>
                            </TableCell>
                            <TableCell>
                                <Chip size="sm" color="success" variant="flat">{company.totalRentArea || 0} m²</Chip>
                            </TableCell>
                            <TableCell>
                                <div className="flex justify-center gap-2">
                                    <Button isIconOnly size="sm" variant="flat" color="warning" onPress={() => openModal(company)}><IconEdit size={16} /></Button>
                                    <Button isIconOnly size="sm" variant="flat" color="danger" onPress={() => confirmDelete(company.consumerId)}><IconTrash size={16} /></Button>
                                </div>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>

            <Modal isOpen={isOpen} onOpenChange={onOpenChange} backdrop="blur">
                <ModalContent>
                    {(onClose) => (
                        <>
                            <ModalHeader className="font-bold">{isEdit ? "Cập nhật công ty" : "Đăng ký công ty mới"}</ModalHeader>
                            <ModalBody className="space-y-4">

                                {/* 🚀 KHU VỰC HIỂN THỊ LỖI SERVER XỊN SÒ */}
                                {serverError && (
                                    <div className="flex items-start gap-2 p-3 bg-danger-50 border border-danger-200 rounded-xl text-danger-600 text-sm">
                                        <IconAlertCircle size={18} className="mt-0.5 flex-shrink-0" />
                                        <p>{serverError}</p>
                                    </div>
                                )}

                                {/* Các ô Input giữ nguyên logic báo lỗi cũ */}
                                <Input label="Mã công ty (*)" value={formData.companyId} isInvalid={!!errors.companyId} errorMessage={errors.companyId} onChange={e => { setFormData({ ...formData, companyId: e.target.value }); if (errors.companyId) setErrors({ ...errors, companyId: '' }); setServerError(""); }} onKeyDown={handleKeyDown} />
                                <Input label="Tên doanh nghiệp (*)" value={formData.companyName} isInvalid={!!errors.companyName} errorMessage={errors.companyName} onChange={e => { setFormData({ ...formData, companyName: e.target.value }); if (errors.companyName) setErrors({ ...errors, companyName: '' }); setServerError(""); }} onKeyDown={handleKeyDown} />
                                <Input label="Mã số thuế" value={formData.taxCode} onChange={e => { setFormData({ ...formData, taxCode: e.target.value }); setServerError(""); }} onKeyDown={handleKeyDown} />
                                <Input label="Số điện thoại (*)" value={formData.phoneNo} isInvalid={!!errors.phoneNo} errorMessage={errors.phoneNo} onChange={e => { setFormData({ ...formData, phoneNo: e.target.value }); if (errors.phoneNo) setErrors({ ...errors, phoneNo: '' }); setServerError(""); }} onKeyDown={handleKeyDown} />
                                <Input label="Email" type="email" value={formData.email} isInvalid={!!errors.email} errorMessage={errors.email} onChange={e => { setFormData({ ...formData, email: e.target.value }); if (errors.email) setErrors({ ...errors, email: '' }); setServerError(""); }} onKeyDown={handleKeyDown} />
                            </ModalBody>
                            <ModalFooter>
                                <Button variant="flat" onPress={onClose} isDisabled={isSubmitting}>Hủy</Button>
                                <Button color="primary" onPress={handleSave} isLoading={isSubmitting} startContent={!isSubmitting && <IconDeviceFloppy size={18} />}>
                                    {isSubmitting ? "Đang lưu..." : "Lưu dữ liệu"}
                                </Button>
                            </ModalFooter>
                        </>
                    )}
                </ModalContent>
            </Modal>

            {/* MODAL XÓA */}
            {/* ... (Phần Modal xóa giữ nguyên) ... */}
            <Modal isOpen={isDelOpen} onOpenChange={onDelOpenChange} size="xs" backdrop="blur">
                <ModalContent>
                    <ModalHeader className="text-danger">⚠️ Xác nhận</ModalHeader>
                    <ModalBody><p className="text-sm font-medium text-center">Xóa hồ sơ công ty này?</p></ModalBody>
                    <ModalFooter>
                        <Button variant="light" onPress={onDelClose}>Hủy</Button>
                        <Button color="danger" onPress={executeDelete}>Đồng ý xóa</Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </div>
    );
}