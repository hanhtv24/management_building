'use client';

import { useEffect, useState } from 'react';
import {
    Table, TableHeader, TableColumn, TableBody, TableRow, TableCell,
    Button, Input, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure, Chip,
    useDisclosure as useDisclosureNew
} from '@heroui/react';
import { IconPlus, IconEdit, IconTrash, IconDeviceFloppy } from '@tabler/icons-react';

export default function OfficePage() {
    const [offices, setOffices] = useState([]);
    const [loading, setLoading] = useState(true);
    const { isOpen, onOpen, onOpenChange, onClose } = useDisclosure();

    // State cho Form
    const [formData, setFormData] = useState({ officeId: '', floor: '', room: '', area: '', unitPrice: '' });
    const [isEdit, setIsEdit] = useState(false);

    const {
        isOpen: isDeleteOpen,
        onOpen: onDeleteOpen,
        onOpenChange: onDeleteOpenChange,
        onClose: onDeleteClose
    } = useDisclosure();

    const [deleteId, setDeleteId] = useState<string | null>(null);

    const fetchOffices = () => {
        setLoading(true);
        fetch('/api/office').then(res => res.json()).then(data => {
            setOffices(data.data || []);
            setLoading(false);
        });
    };

    useEffect(() => { fetchOffices(); }, []);

    // Hàm xử lý Lưu (Cả Thêm & Sửa)
    const handleSave = async () => {
        // Kiểm tra dữ liệu đầu vào cơ bản
        if (!formData.officeId || !formData.floor || !formData.area || !formData.unitPrice) {
            alert("Vui lòng nhập đầy đủ thông tin!");
            return;
        }

        const method = isEdit ? 'PUT' : 'POST';

        try {
            const res = await fetch('/api/office', {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            const result = await res.json();

            if (result.success) {
                fetchOffices();
                onClose();
                // Reset form nếu là thêm mới
                if (!isEdit) setFormData({ officeId: '', floor: '', room: '', area: '', unitPrice: '' });
            } else {
                alert("Lỗi: " + result.error);
            }
        } catch (error) {
            console.error("Lỗi khi gọi API:", error);
            alert("Không thể kết nối với máy chủ!");
        }
    };
    // Hàm xóa
    const confirmDelete = (id: string) => {
        setDeleteId(id);
        onDeleteOpen();
    };

    const handleExecuteDelete = async () => {
        if (!deleteId) return;
        const res = await fetch(`/api/office?id=${deleteId}`, { method: 'DELETE' });
        if (res.ok) {
            fetchOffices();
            onDeleteClose();
        }
    };

    // Hàm xử lý khi nhấn phím bất kỳ trong Input
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSave();
        }
    };

    const openModal = (item?: any) => {
        if (item) {
            setFormData(item);
            setIsEdit(true);
        } else {
            setFormData({ officeId: '', floor: '', room: '', area: '', unitPrice: '' });
            setIsEdit(false);
        }
        onOpen();
    };

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold italic">🏢 QUẢN LÝ MẶT BẰNG</h1>
                <Button color="primary" onPress={() => openModal()} startContent={<IconPlus size={18} />}>
                    Thêm Văn Phòng
                </Button>
            </div>

            <Table aria-label="Office Table" shadow="none" className="border border-neutral-200 rounded-xl">
                <TableHeader>
                    <TableColumn>MÃ PHÒNG</TableColumn>
                    <TableColumn>TẦNG / PHÒNG</TableColumn>
                    <TableColumn>DIỆN TÍCH</TableColumn>
                    <TableColumn>GIÁ THUÊ/M²/THÁNG</TableColumn>
                    <TableColumn align="center">HÀNH ĐỘNG</TableColumn>
                </TableHeader>
                <TableBody isLoading={loading} emptyContent={"Chưa có dữ liệu."}>
                    {offices.map((office: any) => (
                        <TableRow key={office.officeId}>
                            <TableCell className="font-bold">{office.officeId}</TableCell>
                            <TableCell>Tầng {office.floor} - P.{office.room}</TableCell>
                            <TableCell>{office.area} m²</TableCell>
                            <TableCell>{Number(office.unitPrice).toLocaleString()} đ</TableCell>
                            <TableCell>
                                <div className="flex justify-center gap-2">
                                    <Button isIconOnly size="sm" variant="flat" color="warning" onPress={() => openModal(office)}>
                                        <IconEdit size={16} />
                                    </Button>
                                    <Button
                                        isIconOnly
                                        size="sm"
                                        variant="flat"
                                        color="danger"
                                        onPress={() => confirmDelete(office.officeId)} // Gọi hàm mở popup xác nhận
                                    >
                                        <IconTrash size={16} />
                                    </Button>
                                </div>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>

            {/* MODAL FORM */}
            <Modal isOpen={isOpen} onOpenChange={onOpenChange} placement="top-center">
                <ModalContent>
                    <ModalHeader>{isEdit ? "Chỉnh sửa văn phòng" : "Thêm văn phòng mới"}</ModalHeader>
                    <ModalBody className="space-y-4">
                        <Input
                            label="Mã phòng"
                            placeholder="Ví dụ: P101"
                            isDisabled={isEdit}
                            value={formData.officeId}
                            onChange={(e) => setFormData({ ...formData, officeId: e.target.value })}
                            onKeyDown={handleKeyDown} // Thêm dòng này
                        />
                        <div className="flex gap-4">
                            <Input
                                label="Tầng"
                                type="number"
                                value={formData.floor}
                                onChange={(e) => setFormData({ ...formData, floor: e.target.value })}
                                onKeyDown={handleKeyDown} // Thêm dòng này
                            />
                            <Input
                                label="Số phòng"
                                value={formData.room}
                                onChange={(e) => setFormData({ ...formData, room: e.target.value })}
                                onKeyDown={handleKeyDown} // Thêm dòng này
                            />
                        </div>
                        <Input
                            label="Diện tích (m2)"
                            type="number"
                            value={formData.area}
                            onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                            onKeyDown={handleKeyDown} // Thêm dòng này
                        />
                        <Input
                            label="Đơn giá (VNĐ)"
                            type="number"
                            value={formData.unitPrice}
                            onChange={(e) => setFormData({ ...formData, unitPrice: e.target.value })}
                            onKeyDown={handleKeyDown} // Thêm dòng này
                        />
                    </ModalBody>
                    <ModalFooter>
                        <Button variant="flat" onPress={onClose}>Hủy</Button>
                        <Button color="primary" onPress={handleSave} startContent={<IconDeviceFloppy size={18} />}>
                            Lưu dữ liệu
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>
            <Modal isOpen={isDeleteOpen} onOpenChange={onDeleteOpenChange} backdrop="blur" size="xs">
                <ModalContent>
                    {(onClose) => (
                        <>
                            <ModalHeader className="flex flex-col gap-1 text-danger">⚠️ Xác nhận xóa</ModalHeader>
                            <ModalBody>
                                <p className="text-sm">
                                    Bạn có chắc chắn muốn xóa văn phòng <span className="font-bold">{deleteId}</span>?
                                </p>
                            </ModalBody>
                            <ModalFooter>
                                <Button variant="light" onPress={onClose}>
                                    Hủy bỏ
                                </Button>
                                <Button color="danger" variant="shadow" onPress={handleExecuteDelete}>
                                    Đồng ý xóa
                                </Button>
                            </ModalFooter>
                        </>
                    )}
                </ModalContent>
            </Modal>
        </div>
    );
}