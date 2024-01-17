const {open, close} = require('node:fs');
const Jimp = require('jimp');
const inquirer = require('inquirer');

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
    return `${name}-with-watermark.${ext}`;
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
    }, {
        name: 'watermarkType',
        type: 'list',
        choices: ['Text watermark', 'Image watermark'],
    }]);

    try {
        await checkFileExists('./img/' + options.inputImage);
        if (options.watermarkType === 'Image watermark') {
            const image = await inquirer.prompt([{
                name: 'filename',
                type: 'input',
                message: 'Type your watermark name:',
                default: 'logo.png',
            }])
            options.watermarkImage = image.filename;
            await checkFileExists('./img/' + options.watermarkImage);
            addImageWatermarkToImage('./img/' + options.inputImage, './img/' + prepareOutputFilename(options.inputImage), './img/' + options.watermarkImage);
        } else {
            const text = await inquirer.prompt([{
                name: 'value',
                type: 'input',
                message: 'Type your watermark text:',
            }])
            options.watermarkText = text.value;
            addTextWatermarkToImage('./img/' + options.inputImage, './img/' + prepareOutputFilename(options.inputImage), options.watermarkText);
        }
    } catch (error) {
        console.log(error);
        startApp();
    }
};

startApp();




