export const FILE_SIZE_LIMITS = {
  IMAGE: {
    MAX_SIZE: 1 * 1024 * 1024, // 1 MB
    LABEL: '1 MB',
    EMOJI: '🖼️'
  },
  VIDEO: {
    MAX_SIZE: 10 * 1024 * 1024, // 10 MB
    LABEL: '10 MB',
    EMOJI: '🎥'
  }
};

export const ALLOWED_FILE_TYPES = {
  IMAGE: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
  VIDEO: ['video/mp4', 'video/mpeg', 'video/webm']
};

export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const validateFile = (file) => {
  if (!file) return { valid: false, error: 'No file selected' };

  // Check if image
  if (file.type.startsWith("image/")) {
    if (file.size > FILE_SIZE_LIMITS.IMAGE.MAX_SIZE) {
      return {
        valid: false,
        error: `Image too large! ${formatFileSize(file.size)} (Max: ${FILE_SIZE_LIMITS.IMAGE.LABEL})`
      };
    }
    return { valid: true };
  }

  // Check if video
  if (file.type.startsWith("video/")) {
    if (file.size > FILE_SIZE_LIMITS.VIDEO.MAX_SIZE) {
      return {
        valid: false,
        error: `Video too large! ${formatFileSize(file.size)} (Max: ${FILE_SIZE_LIMITS.VIDEO.LABEL})`
      };
    }
    return { valid: true };
  }

  // Invalid file type
  return {
    valid: false,
    error: 'Only images and videos are allowed'
  };
};