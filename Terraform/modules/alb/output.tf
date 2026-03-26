output "aws_lb_controller_helm" {
  description = "AWS Load Balancer Controller Helm release info"
  value = {
    name      = helm_release.aws_lb_controller.name
    namespace = helm_release.aws_lb_controller.namespace
    chart     = helm_release.aws_lb_controller.chart
    status    = helm_release.aws_lb_controller.status
  }
}

output "lb_controller_node_policy_attachment" {
  description = "IAM policy attached to node group for AWS LB Controller"
  value = {
    policy_arn = "arn:aws:iam::aws:policy/ElasticLoadBalancingFullAccess"
  }
}

