"use client";

import { useEffect, useState } from "react";

export default function ExcelViewerClient({ fileUrl }: { fileUrl: string }) {
  const [ExcelViewer, setExcelViewer] = useState<any>(null);

  useEffect(() => {
    // 动态导入 ExcelViewer
    // @ts-ignore
    import("excel-viewer").then((module) => {
      setExcelViewer(() => module.default);
    });
  }, []);

  useEffect(() => {
    if (ExcelViewer && fileUrl) {
      new ExcelViewer("#excel-view", fileUrl, { themeBtn: false });
    }
  }, [ExcelViewer, fileUrl]);

  return (
    <>
      <div id="excel-view"></div>
    </>
  );
}