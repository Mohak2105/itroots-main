import path from 'path';

const STUDY_MATERIAL_EXTENSIONS: Record<string, string[]> = {
    IMAGE: ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.bmp'],
    PDF: ['.pdf'],
    PPT: ['.ppt', '.pptx'],
    DOC: ['.doc', '.docx'],
};

export const getStudyMaterialType = (source?: string | null) => {
    if (!source) return null;

    const sanitizedSource = String(source).split('?')[0].split('#')[0];
    const extension = path.extname(sanitizedSource).toLowerCase();

    if (!extension) return null;

    if (STUDY_MATERIAL_EXTENSIONS.PDF.includes(extension)) {
        return 'PDF';
    }

    if (STUDY_MATERIAL_EXTENSIONS.PPT.includes(extension)) {
        return 'PPT';
    }

    if (STUDY_MATERIAL_EXTENSIONS.DOC.includes(extension)) {
        return 'DOC';
    }

    if (STUDY_MATERIAL_EXTENSIONS.IMAGE.includes(extension)) {
        return 'IMAGE';
    }

    return null;
};

export const isSupportedStudyMaterial = (source?: string | null) => Boolean(getStudyMaterialType(source));

export const STUDY_MATERIAL_FILE_HELPER_TEXT = 'Study materials must be image files, PDF files, PPT/PPTX files, or DOC/DOCX files.';
