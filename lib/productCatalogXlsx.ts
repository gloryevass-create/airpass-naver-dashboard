import { strFromU8, strToU8, unzipSync, zipSync } from "fflate";
import type { ProductCatalogItem, ProductSupplyType } from "@/lib/queries/productCatalog";

/** 제품 카탈로그 엑셀(.xlsx) 내보내기/가져오기 — 참고 저장소(WHIZZUP)의
 * lib/product-catalog-xlsx.ts를 우리 필드명에 맞춰 그대로 이식했다. `xlsx`(SheetJS)
 * npm 패키지는 알려진 프로토타입 오염/ReDoS 취약점이 있고 패치도 없어(사용자 업로드
 * 파일을 파싱하는 이 기능과 정확히 겹치는 공격 표면이라) 쓰지 않는다 — 대신 fflate(zip)
 * + 이 파일 전용의 좁은 정규식 기반 XML 파서로 직접 구현해 공격 표면을 최소화한다. */

export type ProductCatalogImportRow = {
  rowNumber: number;
  name: string;
  specification: string;
  unitPrice: number | null;
  note: string;
  supplyType: ProductSupplyType | null;
  commissionRate: number | null;
  marginRate: number | null;
  reference: string;
  errors: string[];
};

const HEADERS = ["품명", "규격", "단가", "비고", "공급 구분", "수수료율 / 마진율", "참고사항"] as const;

function escapeXml(value: unknown) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function decodeXml(value: string) {
  return value
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCodePoint(Number.parseInt(code, 16)))
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&gt;/g, ">")
    .replace(/&lt;/g, "<")
    .replace(/&amp;/g, "&");
}

function columnName(index: number) {
  let value = index + 1;
  let name = "";
  while (value > 0) {
    const remainder = (value - 1) % 26;
    name = String.fromCharCode(65 + remainder) + name;
    value = Math.floor((value - 1) / 26);
  }
  return name;
}

function inlineCell(ref: string, value: unknown, style = 1) {
  return `<c r="${ref}" t="inlineStr" s="${style}"><is><t xml:space="preserve">${escapeXml(value)}</t></is></c>`;
}

function numberCell(ref: string, value: number | null, style: number) {
  if (value === null) return "";
  return `<c r="${ref}" s="${style}"><v>${value}</v></c>`;
}

function buildSheet(items: ProductCatalogItem[]) {
  const header = HEADERS.map((value, index) => inlineCell(`${columnName(index)}1`, value, 4)).join("");
  const rows = items
    .map((item, index) => {
      const row = index + 2;
      return `<row r="${row}">
        ${inlineCell(`A${row}`, item.name)}
        ${inlineCell(`B${row}`, item.specification ?? "")}
        ${numberCell(`C${row}`, item.unitPrice, 2)}
        ${inlineCell(`D${row}`, item.note ?? "")}
        ${inlineCell(`E${row}`, item.supplyType === "direct" ? "직공급" : "협력사 공급")}
        ${numberCell(`F${row}`, item.supplyType === "direct" ? item.marginRate : item.commissionRate, 3)}
        ${inlineCell(`G${row}`, item.reference ?? "")}
      </row>`;
    })
    .join("");
  const lastRow = Math.max(1, items.length + 1);

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <dimension ref="A1:G${lastRow}"/>
  <sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>
  <cols>
    <col min="1" max="1" width="30" customWidth="1"/>
    <col min="2" max="2" width="46" customWidth="1"/>
    <col min="3" max="3" width="16" customWidth="1"/>
    <col min="4" max="4" width="34" customWidth="1"/>
    <col min="5" max="5" width="16" customWidth="1"/>
    <col min="6" max="6" width="18" customWidth="1"/>
    <col min="7" max="7" width="40" customWidth="1"/>
  </cols>
  <sheetData><row r="1">${header}</row>${rows}</sheetData>
  <autoFilter ref="A1:G${lastRow}"/>
</worksheet>`;
}

export function createProductCatalogWorkbook(items: ProductCatalogItem[]): Uint8Array {
  const files: Record<string, Uint8Array> = {
    "[Content_Types].xml": strToU8(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
  <Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
  <Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>
  <Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>
</Types>`),
    "_rels/.rels": strToU8(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>
  <Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/>
</Relationships>`),
    "xl/workbook.xml": strToU8(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets><sheet name="제품 목록" sheetId="1" r:id="rId1"/></sheets>
</workbook>`),
    "xl/_rels/workbook.xml.rels": strToU8(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`),
    "xl/worksheets/sheet1.xml": strToU8(buildSheet(items)),
    "xl/styles.xml": strToU8(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <numFmts count="2"><numFmt numFmtId="164" formatCode="#,##0&quot;원&quot;"/><numFmt numFmtId="165" formatCode="0.##%"/></numFmts>
  <fonts count="2"><font><sz val="11"/><name val="맑은 고딕"/></font><font><b/><color rgb="FFFFFFFF"/><sz val="11"/><name val="맑은 고딕"/></font></fonts>
  <fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FF0066CC"/><bgColor indexed="64"/></patternFill></fill></fills>
  <borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>
  <cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
  <cellXfs count="5">
    <xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>
    <xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0" applyAlignment="1"><alignment vertical="center" wrapText="1"/></xf>
    <xf numFmtId="164" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1" applyAlignment="1"><alignment horizontal="right"/></xf>
    <xf numFmtId="165" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1" applyAlignment="1"><alignment horizontal="right"/></xf>
    <xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>
  </cellXfs>
  <cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>
</styleSheet>`),
    "docProps/core.xml": strToU8(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <dc:title>에어패스 제품 카탈로그</dc:title><dc:creator>AIRPASS</dc:creator><cp:lastModifiedBy>AIRPASS</cp:lastModifiedBy>
  <dcterms:created xsi:type="dcterms:W3CDTF">${new Date().toISOString()}</dcterms:created>
</cp:coreProperties>`),
    "docProps/app.xml": strToU8(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties" xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes">
  <Application>AIRPASS Naver Dashboard</Application>
</Properties>`),
  };
  return zipSync(files, { level: 6 });
}

function parseSharedStrings(files: Record<string, Uint8Array>) {
  const file = files["xl/sharedStrings.xml"];
  if (!file) return [] as string[];
  const xml = strFromU8(file);
  return [...xml.matchAll(/<si\b[^>]*>([\s\S]*?)<\/si>/g)].map((match) =>
    decodeXml([...match[1].matchAll(/<t\b[^>]*>([\s\S]*?)<\/t>/g)].map((part) => part[1]).join(""))
  );
}

function parseCellValue(cell: string, type: string, sharedStrings: string[]) {
  if (type === "inlineStr") {
    return decodeXml([...cell.matchAll(/<t\b[^>]*>([\s\S]*?)<\/t>/g)].map((part) => part[1]).join(""));
  }
  const raw = cell.match(/<v\b[^>]*>([\s\S]*?)<\/v>/)?.[1] ?? "";
  if (type === "s") return sharedStrings[Number(raw)] ?? "";
  return decodeXml(raw);
}

function parseNullableNumber(value: string, kind: "price" | "rate") {
  const cleaned = value.trim().replace(/[,\s원]/g, "").replace(/%$/, "");
  if (!cleaned) return { value: null as number | null, error: "" };
  const parsed = Number(cleaned);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return { value: null as number | null, error: "숫자 형식을 확인해 주세요." };
  }
  if (kind === "rate") {
    const normalized = value.includes("%") || parsed > 1 ? parsed / 100 : parsed;
    if (normalized > 1) return { value: null as number | null, error: "비율은 100% 이하로 입력해 주세요." };
    return { value: normalized, error: "" };
  }
  return { value: parsed, error: "" };
}

export function parseProductCatalogWorkbook(buffer: ArrayBuffer): ProductCatalogImportRow[] {
  const files = unzipSync(new Uint8Array(buffer));
  const sheetFile = files["xl/worksheets/sheet1.xml"];
  if (!sheetFile) throw new Error("첫 번째 시트를 찾지 못했습니다.");
  const sheetXml = strFromU8(sheetFile);
  const sharedStrings = parseSharedStrings(files);
  const parsedRows = [...sheetXml.matchAll(/<row\b[^>]*r="(\d+)"[^>]*>([\s\S]*?)<\/row>/g)].map((match) => {
    const values: Record<string, string> = {};
    for (const cell of match[2].matchAll(/<c\b([^>]*)r="([A-Z]+)\d+"([^>]*)>([\s\S]*?)<\/c>/g)) {
      const attributes = `${cell[1]} ${cell[3]}`;
      const type = attributes.match(/\bt="([^"]+)"/)?.[1] ?? "";
      values[cell[2]] = parseCellValue(cell[4], type, sharedStrings);
    }
    return { rowNumber: Number(match[1]), values };
  });
  if (!parsedRows.length) throw new Error("엑셀에 읽을 수 있는 행이 없습니다.");

  const headerRow = parsedRows[0];
  const headerMap = new Map(Object.entries(headerRow.values).map(([column, value]) => [value.trim(), column]));
  if (!headerMap.has("품명")) {
    throw new Error("첫 행에 '품명' 열이 필요합니다. 제공된 양식을 이용해 주세요.");
  }
  const columnFor = (header: string) => headerMap.get(header) ?? "";
  const hasSupplyTypeColumn = headerMap.has("공급 구분");
  const rateColumn = headerMap.get("수수료율 / 마진율") ?? headerMap.get("수수료율") ?? "";

  return parsedRows
    .slice(1)
    .map(({ rowNumber, values }): ProductCatalogImportRow | null => {
      const name = (values[columnFor("품명")] ?? "").trim();
      const specification = (values[columnFor("규격")] ?? "").trim();
      const unitPriceResult = parseNullableNumber(values[columnFor("단가")] ?? "", "price");
      const rateResult = parseNullableNumber(values[rateColumn] ?? "", "rate");
      const supplyTypeText = hasSupplyTypeColumn ? (values[columnFor("공급 구분")] ?? "").trim() : "";
      const supplyType: ProductSupplyType | null = !hasSupplyTypeColumn
        ? null
        : /직접|직공급/.test(supplyTypeText)
          ? "direct"
          : /협력|파트너/.test(supplyTypeText) || !supplyTypeText
            ? "partner"
            : null;
      const note = (values[columnFor("비고")] ?? "").trim();
      const reference = (values[columnFor("참고사항")] ?? "").trim();
      if (!name && !specification && unitPriceResult.value === null && !note && rateResult.value === null && !reference) {
        return null;
      }
      const errors: string[] = [];
      if (!name) errors.push("품명이 비어 있습니다.");
      if (unitPriceResult.error) errors.push(`단가: ${unitPriceResult.error}`);
      if (rateResult.error) errors.push(`수수료율 / 마진율: ${rateResult.error}`);
      if (hasSupplyTypeColumn && supplyType === null) {
        errors.push("공급 구분: '협력사 공급' 또는 '직공급'으로 입력해 주세요.");
      }
      return {
        rowNumber,
        name,
        specification,
        unitPrice: unitPriceResult.value,
        note,
        supplyType,
        commissionRate: supplyType === "direct" ? null : rateResult.value,
        marginRate: supplyType === "direct" ? rateResult.value : null,
        reference,
        errors,
      };
    })
    .filter((row): row is ProductCatalogImportRow => Boolean(row));
}
