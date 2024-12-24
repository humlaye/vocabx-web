import axios from 'utils/axios';

export const getWords = async ({ page = 1, perPage = 10 }) => {
    let apiEndpoint = '/api/words';
    try {
        const response = await axios.get(apiEndpoint, {
            params: {
                page,
                perPage
            }
        });
        return response?.data || [];
    } catch (error) {
        console.error('Error fetching words:', error);
        return [];
    }
};