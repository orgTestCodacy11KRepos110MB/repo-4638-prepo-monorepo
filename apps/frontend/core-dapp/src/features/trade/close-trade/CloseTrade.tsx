import { spacingIncrement } from 'prepo-ui'
import styled from 'styled-components'

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${spacingIncrement(16)};
  padding: ${spacingIncrement(8)};
`

const CloseTrade: React.FC = () => (
  <Wrapper>
    <p>TODO: Positions slide up</p>
    <p>TODO: Input</p>
    <p>TODO: Button</p>
    <p>TODO: Summary</p>
  </Wrapper>
)

export default CloseTrade
