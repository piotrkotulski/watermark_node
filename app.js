const {open, close} = require('node:fs');
const Jimp = require('jimp');
const inquirer = require('inquirer');
const fs = require('fs');

const checkFileExists = (filePath) => {
    return new Promise((resolve, reject) => {
        open(filePath, 'r', (err, fd) => {
            if (err) {
                if (err.code === 'ENOENT') {
                    reject(`${filePath} does not exist`);
                } else {
                    reject(`Error opening file: ${filePath}`);
                }
            } else {
                close(fd, (err) => {
                    if (err) {
                        reject(`Error closing file: ${filePath}`);
                    }
                    resolve();
                });
            }
        });
    });
};

const addTextWatermarkToImage = async function (inputFile, outputFile, text) {
    try {
        const image = await Jimp.read(inputFile);
        const font = await Jimp.loadFont(Jimp.FONT_SANS_32_BLACK);
        const textData = {
            text: text,
            alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER,
            alignmentY: Jimp.VERTICAL_ALIGN_MIDDLE,
        };

        image.print(font, 0, 0, textData, image.getWidth(), image.getHeight());
        await image.quality(100).writeAsync(outputFile);
        console.log('Watermark added successfully.');
        startApp();
    } catch (error) {
        console.log('Something went wrong... Try again.');
    }
};

const addImageWatermarkToImage = async function (inputFile, outputFile, watermarkFile) {
    try {
        const image = await Jimp.read(inputFile);
        const watermark = await Jimp.read(watermarkFile);
        const x = image.getWidth() / 2 - watermark.getWidth() / 2;
        const y = image.getHeight() / 2 - watermark.getHeight() / 2;

        image.composite(watermark, x, y, {
            mode: Jimp.BLEND_SOURCE_OVER,
            opacitySource: 0.5,
        });
        await image.quality(100).writeAsync(outputFile);
        console.log('Watermark added successfully.');
        startApp();
    } catch (error) {
        console.log('Something went wrong... Try again.');
    }
};

const prepareOutputFilename = (filename) => {
    const [name, ext] = filename.split('.');
    let counter = 1;
    let newFilename;

    do {
        newFilename = `${name}-with-watermark-${counter}.${ext}`;
        counter++;
    } while (fs.existsSync(`./img/${newFilename}`));

    return newFilename;
};

const editImage = async (inputFile, editType) => {
    const image = await Jimp.read(inputFile);
    switch (editType) {
        case 'make image brighter':
            image.brightness(0.1);
            break;
        case 'increase contrast':
            image.contrast(0.1);
            break;
        case 'make image b&w':
            image.greyscale();
            break;
        case 'invert image':
            image.invert();
            break;
    }
    return image;
};

const startApp = async () => {
    const answer = await inquirer.prompt([{
        name: 'start',
        message: 'Hi! Welcome to "Watermark manager". Copy your image files to `/img` folder. Then you\'ll be able to use them in the app. Are you ready?',
        type: 'confirm'
    }]);

    if (!answer.start) process.exit();

    const options = await inquirer.prompt([{
        name: 'inputImage',
        type: 'input',
        message: 'What file do you want to mark?',
        default: 'MojaFota.jpg',
    }]);

    try {
        const inputPath = './img/' + options.inputImage;
        await checkFileExists(inputPath);
        let image = await Jimp.read(inputPath);

        const editAnswer = await inquirer.prompt([{
            name: 'edit',
            type: 'confirm',
            message: 'Do you want to edit the image before adding a watermark?',
        }]);

        if (editAnswer.edit) {
            const editType = await inquirer.prompt([{
                name: 'type',
                type: 'list',
                message: 'Choose the type of modification:',
                choices: ['make image brighter', 'increase contrast', 'make image b&w', 'invert image'],
            }]);
            image = await editImage(image, editType.type);
        }

        const watermarkTypeAnswer = await inquirer.prompt([{
            name: 'watermarkType',
            type: 'list',
            choices: ['Text watermark', 'Image watermark'],
        }]);

        const outputPath = './img/' + prepareOutputFilename(options.inputImage);

        if (watermarkTypeAnswer.watermarkType === 'Text watermark') {
            const text = await inquirer.prompt([{
                name: 'value',
                type: 'input',
                message: 'Type your watermark text:',
            }]);
            options.watermarkText = text.value;
            await addTextWatermarkToImage(image, outputPath, options.watermarkText);

        } else {
            const imageWatermark = await inquirer.prompt([{
                name: 'filename',
                type: 'input',
                message: 'Type your watermark name:',
                default: 'logo.png',
            }]);
            options.watermarkImage = imageWatermark.filename;
            const watermarkPath = './img/' + options.watermarkImage;
            await checkFileExists(watermarkPath);
            await addImageWatermarkToImage(image, outputPath, watermarkPath);
        }
        console.log('All operations completed successfully. Check the output file:', outputPath);

    } catch (error) {
        console.log('Error:', error);
        startApp();
    }
};

startApp();