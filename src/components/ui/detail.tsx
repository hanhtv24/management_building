'use client';

import Link from 'next/link';
import React, { Fragment, ReactNode } from 'react';

import { Card, CardBody, CardHeader, Chip, Input } from '@heroui/react';
import { IconArrowLeft } from '@tabler/icons-react';

import { LoaiGdColor, LoaiHdColor, TrangThaiColor } from '@/lib/constants';

type Props = {
  title: string;
  backUrl: string;
  renderAction?: ReactNode;
  content: {
    title: string;
    fields: { key: string; label: string; value: any }[];
  }[];
};

const DetailPage: React.FC<Props> = ({
  title,
  backUrl,
  renderAction,
  content,
}) => {
  const renderField = (field: Props['content'][number]['fields'][number]) => {
    switch (field.key) {
      case 'loaiHd':
        return (
          <div className="flex flex-col gap-2">
            <h4 className="text-foreground text-small pointer-events-none block max-w-full shrink-0">
              {field.label}
            </h4>
            <Chip
              className="text-default-600 gap-1 border-none capitalize"
              color={LoaiHdColor[field.value as keyof typeof LoaiHdColor]}
              size="sm"
              variant="flat"
            >
              {field.value}
            </Chip>
          </div>
        );

      case 'loaiGd':
        return (
          <div className="flex flex-col gap-2">
            <h4 className="text-foreground text-small pointer-events-none block max-w-full shrink-0">
              {field.label}
            </h4>
            <Chip
              className="text-default-600 gap-1 border-none capitalize"
              color={LoaiGdColor[field.value as keyof typeof LoaiGdColor]}
              size="sm"
              variant="flat"
            >
              {field.value}
            </Chip>
          </div>
        );

      case 'trangThai':
        return (
          <div className="flex flex-col gap-2">
            <h4 className="text-foreground text-small pointer-events-none block max-w-full shrink-0">
              {field.label}
            </h4>
            <Chip
              className="text-default-600 gap-1 border-none capitalize"
              color={TrangThaiColor[field.value as keyof typeof TrangThaiColor]}
              size="sm"
              variant="flat"
            >
              {field.value}
            </Chip>
          </div>
        );

      default:
        return (
          <Input
            key={field.key}
            readOnly
            label={field.label}
            labelPlacement="outside"
            placeholder={'-'.repeat(6)}
            value={field.value.toString()}
          />
        );
    }
  };

  return (
    <div className="-m-3 flex flex-1 flex-col gap-3 overflow-hidden p-3">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-foreground flex items-center gap-2 text-xl font-bold">
          <Link href={backUrl} className="block cursor-pointer">
            <IconArrowLeft />
          </Link>
          {title}
        </h1>
        {renderAction}
      </div>

      <div className="-m-3 flex flex-col gap-3 overflow-auto p-3">
        {content.map((item) => (
          <Card className="overflow-visible" key={item.title}>
            <CardHeader>{item.title}</CardHeader>
            <CardBody className="gap-3">
              <div className="grid grid-cols-2 gap-3">
                {item.fields.map((field) => (
                  <Fragment key={field.key}>{renderField(field)}</Fragment>
                ))}
              </div>
            </CardBody>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default DetailPage;
