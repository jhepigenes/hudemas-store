const fetch = require('node-fetch');

const feedbackIds = [
    '1764657069577',
    '1764655850654',
    '1764655644083',
    '1764619879928',
    '1764619640484',
    '1764618869343',
    '1764616800541',
    '1764616343888',
    '1764616165547'
];

async function updateFeedback() {
    // Fetch current feedback first to get the full objects (needed for PUT)
    // Since I don't have the full objects and the API requires replacing the whole list (PUT),
    // I need to fetch, modify, and push back.
    
    // URL: https://hudemas-store-lnp3jw46b-hudemas-projects.vercel.app/api/beta-feedback
    const url = 'https://hudemas-store.vercel.app/api/beta-feedback';
    
    try {
        const res = await fetch(url);
        const currentList = await res.json();
        
        if (!Array.isArray(currentList)) {
            console.error('Failed to fetch list');
            return;
        }

        const updatedList = currentList.map(item => {
            if (feedbackIds.includes(item.id)) {
                return { ...item, status: 'done' };
            }
            return item;
        });

        const putRes = await fetch(url, {
            method: 'PUT',
            body: JSON.stringify(updatedList)
        });

        if (putRes.ok) {
            console.log('Successfully marked items as done.');
        } else {
            console.error('Failed to update:', await putRes.text());
        }

    } catch (e) {
        console.error(e);
    }
}

updateFeedback();
