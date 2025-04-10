import { DeleteOutlined, ImportOutlined, PlusOutlined } from '@ant-design/icons';
import { Autocomplete, Box, Button, Chip, Divider, FormControl, Grid, IconButton, InputLabel, MenuItem, Select, Stack, TextField } from '@mui/material';
import LanguageSelector from 'components/LanguageSelector';
import MainCard from 'components/MainCard';
import Toast from 'components/Toast';
import useAuth from 'hooks/useAuth';
import React, { useEffect, useState } from 'react';
import axios from 'utils/axios';
import { getLanguages } from 'utils/crud/LanguageController';
import queryClient from 'utils/queryClient';

function AddWord({
    showImportButton = true
}) {
    const { user } = useAuth();

    const [translations, setTranslations] = useState([]);
    const [languages, setLanguages] = useState([]);
    const [selectedLanguage, setSelectedLanguage] = useState(null);
    const [word, setWord] = useState('');

    const [snackbar, setSnackbar] = useState({
        open: false,
        message: '',
        severity: 'success'
    });

    useEffect(() => {
        const fetchLanguages = async () => {
            const languageList = await getLanguages();
            setLanguages(languageList);
        };

        fetchLanguages();
    }, []);

    useEffect(() => {
        const fetchLanguages = async () => {
            const languageList = await getLanguages();
            setLanguages(languageList);

            // If we already know the user's target language
            if (user[0]?.target_language) {
                // Find the corresponding language object
                const matchedLang = languageList.find(
                    (lang) => lang.code === user[0].target_language
                );
                if (matchedLang) {
                    setSelectedLanguage(matchedLang);
                }
            }
        };

        fetchLanguages();
    }, [user]);


    // Add a new translation input with unique ID
    const addTranslation = () => {
        if (translations.length >= languages.length) return;

        const newTranslation = {
            id: Date.now(), // unique ID
            language_code: '',
            translation: ''
        };
        setTranslations([...translations, newTranslation]);
    };

    // Remove a translation by ID
    const removeTranslation = (translationId) => {
        setTranslations(prevTranslations =>
            prevTranslations.filter(t => t.id !== translationId)
        );
    };

    // Update translation
    const updateTranslation = (id, field, value) => {
        setTranslations(prevTranslations =>
            prevTranslations.map(t =>
                t.id === id ? { ...t, [field]: value } : t
            )
        );
    };

    const handleSubmit = async () => {
        // 1. Filter out translations that do not have a language_code or translation text
        const filteredTranslations = translations.filter(
            (t) => t.language_code.trim() !== '' && t.translation.trim() !== ''
        );

        // 2. Build the payload with only valid translations
        const payload = {
            language_code: selectedLanguage.code,
            word: word,
            translations: filteredTranslations
        }

        try {
            const response = await axios.post('/api/words', payload);

            if (response.status === 201) {
                setSnackbar({
                    open: true,
                    message: 'Word created successfully',
                    severity: 'success'
                });

                queryClient.invalidateQueries(['words']); // Refetch the words
                resetFormFields();
            }

        } catch (error) {
            console.error('Error creating word:', error);
            setSnackbar({
                open: true,
                message: 'Error creating word',
                severity: 'error'
            });
        }
    }

    const handleWordImport = async (e) => {
        const file = e.target.files[0];

        if (file) {
            const formData = new FormData();
            formData.append('file', file);

            try {
                const response = await axios.post('/api/words/import', formData, {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                    },
                });
                console.log(response);
                if (response.status === 201) {
                    setSnackbar({
                        open: true,
                        message: `${response?.data?.imported} words imported successfully. ${response?.data?.duplicates} duplicates. ${response?.data?.passed} passed. ${response?.data?.errors} errors.`,
                        severity: 'success'
                    });

                    queryClient.invalidateQueries(['words']); // Refetch the words
                }

            } catch (error) {
                console.error('Error importing words:', error);
            }
        }
    }

    const resetFormFields = () => {
        setWord('');
        setTranslations([]);
    }

    const handleCloseSnackbar = () => {
        setSnackbar({
            open: false
        });
    };

    return (
        <MainCard>

            <Stack direction='row' justifyContent='space-between' spacing={2} mb={2}>
                {
                    showImportButton &&
                    <Button variant="contained" component="label" color='success' startIcon={<ImportOutlined />}>
                        Import
                        <input
                            type="file"
                            hidden
                            accept="application/json"
                            onChange={handleWordImport}
                        />
                    </Button>
                }

                <Button
                    variant="contained"
                    color="primary"
                    startIcon={<PlusOutlined />}
                    onClick={addTranslation}
                    disabled={translations.length >= languages.length}
                >
                    Add Translation
                </Button>
            </Stack>

            <LanguageSelector
                languages={languages}
                value={selectedLanguage}
                onChange={setSelectedLanguage}
                useTargetLang
                variant="autocomplete"
                label="Language"
                sx={{ mb: 2 }}
            />

            <TextField
                id="word-input"
                label="Word"
                variant="outlined"
                value={word}
                sx={{ mb: 2 }}
                onChange={(e) => setWord(e.target.value)}
                fullWidth
            />

            {translations.length > 0 && (
                <>
                    <Divider sx={{ mb: 2 }}>
                        <Chip label="Translations" />
                    </Divider>
                    {translations.map((translation) => (
                        <Grid key={translation.id} container spacing={2} sx={{ mb: 2 }} alignItems="center">
                            <Grid item xs={12} sm={2}>
                                <LanguageSelector
                                    languages={languages}
                                    value={languages.find(lang => lang.code === translation.language_code) || null}
                                    onChange={(newLang) =>
                                        updateTranslation(translation.id, 'language_code', newLang ? newLang.code : '')
                                    }
                                    useMotherLang
                                    variant="autocomplete"
                                    label="Language"
                                    sx={{ mb: 2 }}
                                />
                            </Grid>

                            <Grid item xs={10} sm={9}>
                                <TextField
                                    fullWidth
                                    label="Translation"
                                    value={translation.translation}
                                    onChange={(e) => updateTranslation(translation.id, 'translation', e.target.value)}
                                />
                            </Grid>
                            <Grid item xs={2} sm={1} display='flex' justifyContent='end' alignItems='center'>
                                <IconButton
                                    color="error"
                                    size='large'
                                    onClick={() => removeTranslation(translation.id)}
                                >
                                    <DeleteOutlined />
                                </IconButton>
                            </Grid>
                        </Grid>
                    ))}
                </>
            )}

            <Button
                variant="contained"
                color="primary"
                onClick={() => handleSubmit()}
                fullWidth
                disabled={word === ''}
            >
                Create Word
            </Button>

            <Toast open={snackbar.open} message={snackbar.message} severity={snackbar.severity} onClose={handleCloseSnackbar} />
        </MainCard>
    );
}

export default AddWord;