const getContainers = () => {
	const containers = document.querySelectorAll('.search-container');
	const avatarContainers = [];

	for (let i = 0; i < containers.length; i++) {
		const container = containers[i];
		const heading = getHeadingInsideContainer(container);

		const anchor = heading.querySelector('a');

		const href = anchor.href;

		if (href.includes('avatar')) {
			avatarContainers.push(container);
		}
	}

	return avatarContainers;
}

const getColumnToInsertInto = (container) => container.querySelector('h4').parentElement;

const cloneAvatarById = async (avatarId) => {
	console.log(`Cloning avatar ${avatarId}...`);

	const response = await fetch(`https://vrchat.com/api/1/avatars/${avatarId}/select`, {
		method: 'PUT'
	});

	if (!response.ok) {
		throw new Error(`Failed to clone avatar ${avatarId}: ${response.status} ${response.statusText}`);
	}

	console.log('Avatar has been cloned successfully');
}

const createButtonForContainer = (container) => {
	const button = document.createElement('button');

	const setStatus = (newText) => {
		button.innerText = newText
	}

	setStatus('Clone');

	button.classList.add('btn');
	button.classList.add('btn-lg');
	button.classList.add('clone-btn');

	button.onclick = async () => {
		try {
			setStatus('Cloning...');

			const avatarId = getAvatarIdInContainer(container);

			await cloneAvatarById(avatarId);

			setStatus('Cloned - open VRChat');
		} catch (err) {
			console.error(err);
			setStatus('Failed to clone');
		}
	}

	return button;
}

const insertButtonIntoContainer = (container) => {
	const columnToInsertInto = getColumnToInsertInto(container);

	if (columnToInsertInto.querySelector('.clone-btn')) {
		return
	}

	const button = createButtonForContainer(container);

	columnToInsertInto.appendChild(button);
	
	console.log('Button has been inserted');
}

const getHeadingInsideContainer = (container) => container.querySelector('h4')

const getAvatarIdInContainer = (container) => {
	const heading = getHeadingInsideContainer(container);

	const anchor = heading.querySelector('a');

	const href = anchor.href;

	const avatarId = href.split('/').pop();

	console.log(`Found avatar ID ${avatarId}`);
	
	return avatarId;
}

let waitForContainerInterval

const waitForContainers = async () => new Promise(resolve => {
	if (waitForContainerInterval) {
		clearInterval(waitForContainerInterval);
	}

	waitForContainerInterval = setInterval(() => {
		console.log('Waiting for containers...');

		const containers = getContainers();

		if (containers.length > 0) {
			console.log(`Found ${containers.length} containers`);

			clearInterval(waitForContainerInterval);
			resolve();
		}
	}, 500);
})

let knownContainers = [];

const onNewContainersFound = (callback) => {
	setInterval(() => {
		const allContainers = getContainers();
		const newContainers = [];

		for (const container of allContainers) {
			if (!knownContainers.includes(container)) {
				newContainers.push(container);
				knownContainers.push(container);
			}
		}

		if (newContainers.length > 0) {
			callback(newContainers);
		}
	}, 500);
}

const main = async () => {
	console.log('Starting up...');

	await waitForContainers();
	
	knownContainers = [];

	const allContainers = getContainers();

	for (const container of allContainers) {
		insertButtonIntoContainer(container);
		knownContainers.push(container);
	}

	onNewContainersFound(containers => {
		for (const container of containers) {
			insertButtonIntoContainer(container);
		}
	});

	console.log('Done!');
}

const onNavigation = (callback) => {
	let previousUrl = location.href;

	setInterval(() => {
		const currentUrl = location.href;

		if (currentUrl !== previousUrl) {
			previousUrl = currentUrl;
			callback();
		}
	}, 500);
}

chrome.extension.sendMessage({}, function(response) {
	var readyStateCheckInterval = setInterval(function() {
	if (document.readyState === "complete") {
		clearInterval(readyStateCheckInterval);

		main();

		onNavigation(() => {
			main();
		});
	}
	}, 10);
});