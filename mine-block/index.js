const core = require("@actions/core");
const { execSync } = require("child_process");
const { validate } = require("./test");

const env = {
	PATH: process.env.PATH,
	FORCE_COLOR: "true",
	DOTNET_CLI_HOME: "/tmp",
	DOTNET_NOLOGO: "true",
	HOME: process.env.HOME,
};

function btoa(str) {
	return Buffer.from(str).toString("base64");
}

function generateResult(
	status,
	testName,
	command,
	message,
	duration,
	maxScore,
	score = 0
) {
	return {
		version: 1,
		status,
		max_score: maxScore,
		tests: [
			{
				name: testName,
				status,
				score,
				message,
				test_code: command,
				filename: "",
				line_no: 0,
				duration,
			},
		],
	};
}

function getErrorMessageAndStatus(error, command) {
	if (error.message.includes("ETIMEDOUT")) {
		return { status: "error", errorMessage: "Command timed out" };
	}
	if (error.message.includes("command not found")) {
		return {
			status: "error",
			errorMessage: `Unable to locate executable file: ${command}`,
		};
	}
	if (error.message.includes("Command failed")) {
		return { status: "fail", errorMessage: "failed with exit code 1" };
	}
	return { status: "error", errorMessage: error.message };
}

function calculateScore(fee, maxFee, weight, maxWeight) {
	const feeScore = (BigInt(fee) * 100n) / BigInt(maxFee);
	const weightScore = (BigInt(weight) * 100n) / BigInt(maxWeight);
	const score = (feeScore + weightScore) / 2n;
	return parseInt(score.toString());
}

function run() {
	const testName = core.getInput("test-name", { required: true });
	const setupCommand = core.getInput("setup-command");
	const command = core.getInput("command", { required: true });
	const timeout = parseFloat(core.getInput("timeout") || 10) * 60000; // Convert to minutes
	const maxScore = parseInt(core.getInput("max-score") || 100);
	const maxFee = parseInt(core.getInput("max-fee") || 100000000);
	const passingScore = parseInt(core.getInput("passing-score") || 0);

	let output = "";
	let startTime;
	let endTime;
	let result;

	try {
		if (setupCommand) {
			execSync(setupCommand, { timeout });
		}

		startTime = new Date();
		output = execSync(command, { timeout, env }).toString();
		endTime = new Date();

		const { fee, weight } = validate();
		const score = calculateScore(fee, maxFee, weight, 4000000);
		console.log(
			`Score: ${score}\nFee: ${fee}\nWeight: ${weight}\nMax Fee: ${maxFee}\nMax Weight: 4000000`
		);

		if (score < passingScore) {
			console.log(
				`You must have a score of at least ${passingScore} to pass the test. Your score was ${score}.`
			);
			result = generateResult(
				"fail",
				testName,
				command,
				`You must have a score of at least ${passingScore} to pass the test. Your score was ${score}.`,
				endTime - startTime,
				maxScore,
				score
			);
		} else {
			result = generateResult(
				"pass",
				testName,
				command,
				output,
				endTime - startTime,
				maxScore,
				score
			);
		}
	} catch (error) {
		endTime = new Date();
		const { status, errorMessage } = getErrorMessageAndStatus(error, command);
		result = generateResult(
			status,
			testName,
			command,
			errorMessage,
			endTime - startTime,
			maxScore,
			0
		);
	}

	core.setOutput("result", btoa(JSON.stringify(result)));
}

run();
