module.exports = new class Utils {
    formatDate(date) {
        const output = new Date(parseInt(date) * 1000).toISOString().slice(0, 19).replace("T", " ");
        return output;
    }

    waste(seconds) {
        return new Promise(resolve => setTimeout(resolve, seconds * 1000));
    }
}