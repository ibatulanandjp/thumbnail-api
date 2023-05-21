const { generateThumbnail } = require('../../src/services/thumbnailService');
const sharp = require('sharp');

// Mock the sharp library
jest.mock('sharp', () => {
    const resizeMock = jest.fn().mockReturnThis();
    const toFileMock = jest.fn().mockResolvedValueOnce({});

    return jest.fn(() => ({
        resize: resizeMock,
        toFile: toFileMock,
    }));
});

// Mock the logger functions
jest.mock('../../logging/config/logger', () => {
    const infoMock = jest.fn();
    const errorMock = jest.fn();
    return {
        info: infoMock,
        error: errorMock,
    };
});

// Test Implementation
describe('Thumbnail Service', () => {
    describe('generateThumbnail', () => {
        // Before Each Test
        beforeEach(() => {
            imageBuffer = Buffer.from('test-image-buffer');
            width = 100;
            height = 100;
            thumbnailPath = '/path/to/thumbnail.jpg';
        });

        // After Each Test
        afterEach(() => {
            jest.clearAllMocks();
        });

        // === Test #1 ===
        it('should generate a thumbnail given an image file', async () => {
            // Call the generateThumbnail function
            const thumbnail = await generateThumbnail(
                imageBuffer,
                width,
                height,
                thumbnailPath
            );

            // Check if sharp was called with the correct parameters
            expect(sharp).toHaveBeenCalledWith(imageBuffer);
            expect(sharp().resize).toHaveBeenCalledWith(width, height);
            expect(sharp().toFile).toHaveBeenCalledWith(thumbnailPath);

            // Check the returned thumbnail value
            expect(thumbnail).toEqual({});
        });

        // === Test #2 ===
        it('should handle errors during thumbnail generation', async () => {
            // Mock sharp to throw error
            sharp().toFile.mockRejectedValueOnce(
                new Error('Thumbnail generation failed')
            );

            // Call the generateThumbnail function
            const thumbnail = await generateThumbnail(
                imageBuffer,
                width,
                height,
                thumbnailPath
            );

            // Check the returned thumbnail value
            expect(thumbnail).toBeUndefined();
        });
    });
});
