class AgentError(Exception):
    category = "agent_error"

    def __init__(self, message: str) -> None:
        super().__init__(message)
        self.message = message


class AgentConfigurationError(AgentError):
    category = "configuration_error"


class ExternalProviderError(AgentError):
    category = "provider_error"
